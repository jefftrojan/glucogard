import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Star, Zap, Target } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  ADAPTIVE_QUESTIONNAIRE, 
  getNextQuestion, 
  calculateProgress, 
  validateAnswer,
  type Question,
  type QuestionOption 
} from '@/lib/questionnaire';
import { t } from '@/lib/i18n';

export default function SmartAssessmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start with the first question
    const startQuestion = ADAPTIVE_QUESTIONNAIRE.questions.find(
      q => q.id === ADAPTIVE_QUESTIONNAIRE.startQuestionId
    );
    setCurrentQuestion(startQuestion || null);
  }, []);

  useEffect(() => {
    // Update progress whenever answers change
    if (currentQuestion) {
      const newProgress = calculateProgress(currentQuestion.id, answers, ADAPTIVE_QUESTIONNAIRE);
      setProgress(newProgress);
    }
  }, [answers, currentQuestion]);

  const animateTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAnswer = (value: any, option?: QuestionOption) => {
    if (!currentQuestion) return;

    setError(null);
    const validationError = validateAnswer(currentQuestion, value);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Auto-advance for single-choice questions
    if (currentQuestion.type === 'single-choice' && option) {
      setTimeout(() => {
        const nextQuestion = getNextQuestion(
          currentQuestion.id,
          option,
          newAnswers,
          ADAPTIVE_QUESTIONNAIRE
        );

        if (nextQuestion) {
          animateTransition();
          setTimeout(() => setCurrentQuestion(nextQuestion), 150);
        } else {
          submitAssessment(newAnswers);
        }
      }, 500);
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.id];
    const validationError = validateAnswer(currentQuestion, currentAnswer);
    if (validationError) {
      setError(validationError);
      return;
    }

    const selectedOption = currentQuestion.options?.find(opt => opt.value === currentAnswer);
    const nextQuestion = getNextQuestion(
      currentQuestion.id,
      selectedOption || null,
      answers,
      ADAPTIVE_QUESTIONNAIRE
    );

    if (nextQuestion) {
      animateTransition();
      setTimeout(() => setCurrentQuestion(nextQuestion), 150);
    } else {
      submitAssessment(answers);
    }
  };

  const handleBack = () => {
    // Find previous question (simplified - in production, maintain a history stack)
    const currentIndex = ADAPTIVE_QUESTIONNAIRE.questions.findIndex(q => q.id === currentQuestion?.id);
    if (currentIndex > 0) {
      const prevQuestion = ADAPTIVE_QUESTIONNAIRE.questions[currentIndex - 1];
      animateTransition();
      setTimeout(() => setCurrentQuestion(prevQuestion), 150);
    }
  };

  const submitAssessment = async (finalAnswers: Record<string, any>) => {
    setLoading(true);
    try {
      // Get patient ID
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!patientData) {
        throw new Error('Patient record not found');
      }

      // Generate risk score based on answers
      const riskScore = generateRiskScore(finalAnswers);
      const riskCategory = getRiskCategory(riskScore);

      // Create health submission
      const { data: submission, error: submissionError } = await supabase
        .from('health_submissions')
        .insert({
          patient_id: patientData.id,
          answers: finalAnswers,
          status: 'pending',
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Create risk prediction
      const { error: predictionError } = await supabase
        .from('risk_predictions')
        .insert({
          submission_id: submission.id,
          risk_score: riskScore,
          risk_category: riskCategory,
        });

      if (predictionError) throw predictionError;

      // Generate personalized recommendations
      const recommendations = generateRecommendations(finalAnswers, riskCategory);
      
      if (recommendations.length > 0) {
        const { error: recommendationError } = await supabase
          .from('recommendations')
          .insert(
            recommendations.map(rec => ({
              submission_id: submission.id,
              content: rec.content,
              type: rec.type,
            }))
          );

        if (recommendationError) throw recommendationError;
      }

      Alert.alert(
        'Assessment Complete! 🎉',
        'Your personalized health insights are ready. Check your dashboard for detailed results and recommendations.',
        [{ text: 'View Results', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRiskScore = (answers: Record<string, any>): number => {
    let score = 0;

    // Age factor
    const age = parseInt(answers.age || '0');
    if (age >= 45) score += 20;
    else if (age >= 35) score += 10;

    // BMI calculation
    const weight = parseFloat(answers.weight || '0');
    const height = parseFloat(answers.height || '0') / 100;
    if (weight && height) {
      const bmi = weight / (height * height);
      if (bmi >= 30) score += 25;
      else if (bmi >= 25) score += 15;
    }

    // Family history
    if (answers['family-history'] === 'yes') score += 15;

    // Activity level
    if (answers['activity-level'] === 'sedentary') score += 15;
    else if (answers['activity-level'] === 'light') score += 10;

    // Diet habits
    if (answers['diet-habits'] === 'poor') score += 15;
    else if (answers['diet-habits'] === 'fair') score += 10;

    // Symptoms
    const symptoms = answers.symptoms || [];
    if (Array.isArray(symptoms) && !symptoms.includes('none')) {
      score += symptoms.length * 5;
    }

    // Smoking
    if (answers.smoking === 'current') score += 10;
    else if (answers.smoking === 'former') score += 5;

    // Stress and sleep
    const stressLevel = parseInt(answers['stress-level'] || '1');
    if (stressLevel >= 8) score += 10;
    else if (stressLevel >= 6) score += 5;

    if (answers['sleep-quality'] === 'poor') score += 10;
    else if (answers['sleep-quality'] === 'fair') score += 5;

    return Math.min(score, 100);
  };

  const getRiskCategory = (score: number): 'low' | 'moderate' | 'critical' => {
    if (score < 30) return 'low';
    if (score < 70) return 'moderate';
    return 'critical';
  };

  const generateRecommendations = (
    answers: Record<string, any>,
    riskCategory: 'low' | 'moderate' | 'critical'
  ) => {
    const recommendations: Array<{ content: string; type: 'lifestyle' | 'clinical' }> = [];

    // Activity-based recommendations
    if (answers['activity-level'] === 'sedentary') {
      recommendations.push({
        content: 'Start with 10-minute walks after meals. Gradually increase to 30 minutes of daily activity.',
        type: 'lifestyle'
      });
    }

    // Diet-based recommendations
    if (answers['diet-habits'] === 'poor') {
      recommendations.push({
        content: 'Focus on whole foods: vegetables, lean proteins, and whole grains. Limit processed foods and sugary drinks.',
        type: 'lifestyle'
      });
    }

    // Risk-specific recommendations
    if (riskCategory === 'critical') {
      recommendations.push({
        content: 'Schedule an appointment with a healthcare provider within 2 weeks for comprehensive diabetes screening.',
        type: 'clinical'
      });
    } else if (riskCategory === 'moderate') {
      recommendations.push({
        content: 'Consider annual diabetes screening and maintain regular check-ups with your healthcare provider.',
        type: 'clinical'
      });
    }

    // Stress management
    const stressLevel = parseInt(answers['stress-level'] || '1');
    if (stressLevel >= 7) {
      recommendations.push({
        content: 'Practice stress management techniques like deep breathing, meditation, or yoga for 10 minutes daily.',
        type: 'lifestyle'
      });
    }

    return recommendations;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];

    return (
      <Animated.View 
        style={[
          styles.questionContainer,
          {
            opacity: fadeAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20]
              })
            }]
          }
        ]}
      >
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        {currentQuestion.description && (
          <Text style={styles.questionDescription}>{currentQuestion.description}</Text>
        )}

        {currentQuestion.type === 'single-choice' && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  currentAnswer === option.value && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswer(option.value, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentAnswer === option.value && styles.optionTextSelected
                  ]}
                >
                  {option.text}
                </Text>
                {currentAnswer === option.value && (
                  <CheckCircle size={20} color="white" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentQuestion.type === 'multiple-choice' && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option) => {
              const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
                    const newValues = isSelected
                      ? currentValues.filter(v => v !== option.value)
                      : [...currentValues, option.value];
                    handleAnswer(newValues);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}
                  >
                    {option.text}
                  </Text>
                  {isSelected && (
                    <CheckCircle size={20} color="white" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {currentQuestion.type === 'number' && (
          <View style={styles.numberInputContainer}>
            <TextInput
              style={styles.numberInput}
              value={currentAnswer?.toString() || ''}
              onChangeText={(text) => handleAnswer(text)}
              placeholder={`Enter ${currentQuestion.text.toLowerCase()}`}
              keyboardType="numeric"
            />
            {currentQuestion.unit && (
              <Text style={styles.unitText}>{currentQuestion.unit}</Text>
            )}
          </View>
        )}

        {currentQuestion.type === 'slider' && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{currentAnswer || currentQuestion.min}</Text>
            <View style={styles.sliderTrack}>
              {Array.from({ length: (currentQuestion.max || 10) - (currentQuestion.min || 1) + 1 }, (_, i) => {
                const value = (currentQuestion.min || 1) + i;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sliderDot,
                      currentAnswer === value && styles.sliderDotActive
                    ]}
                    onPress={() => handleAnswer(value)}
                  />
                );
              })}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{currentQuestion.min}</Text>
              <Text style={styles.sliderLabel}>{currentQuestion.max}</Text>
            </View>
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Processing your assessment...</Text>
          <Text style={styles.loadingSubtext}>Generating personalized insights</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Brain size={24} color="#0066CC" />
          <Text style={styles.title}>Smart Assessment</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.featuresRow}>
          <View style={styles.feature}>
            <Zap size={16} color="#28A745" />
            <Text style={styles.featureText}>Adaptive</Text>
          </View>
          <View style={styles.feature}>
            <Target size={16} color="#0066CC" />
            <Text style={styles.featureText}>Personalized</Text>
          </View>
          <View style={styles.feature}>
            <Star size={16} color="#FFA500" />
            <Text style={styles.featureText}>Smart</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={handleBack}
          disabled={!currentQuestion || ADAPTIVE_QUESTIONNAIRE.questions.findIndex(q => q.id === currentQuestion.id) === 0}
        >
          <ArrowLeft size={20} color="#64748B" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {currentQuestion?.type !== 'single-choice' && (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginLeft: 12,
  },
  progressContainer: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 2,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 28,
  },
  questionDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F8FAFB',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  optionTextSelected: {
    color: 'white',
  },
  checkIcon: {
    marginLeft: 12,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#1E293B',
    paddingVertical: 16,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 8,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 16,
  },
  sliderTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  sliderDotActive: {
    backgroundColor: '#0066CC',
    transform: [{ scale: 1.2 }],
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    color: '#64748B',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#0066CC',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
});
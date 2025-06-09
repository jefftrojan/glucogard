import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface HealthFormData {
  age: string;
  gender: string;
  weight: string;
  height: string;
  activityLevel: string;
  dietaryHabits: string;
  familyHistory: string;
  symptoms: string[];
  smokingStatus: string;
  alcoholConsumption: string;
}

const symptoms = [
  'Frequent urination',
  'Excessive thirst',
  'Unexplained weight loss',
  'Fatigue',
  'Blurred vision',
  'Slow healing wounds',
  'Frequent infections',
  'None of the above',
];

export default function AssessmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HealthFormData>({
    age: '',
    gender: '',
    weight: '',
    height: '',
    activityLevel: '',
    dietaryHabits: '',
    familyHistory: '',
    symptoms: [],
    smokingStatus: '',
    alcoholConsumption: '',
  });

  const handleSymptomToggle = (symptom: string) => {
    if (symptom === 'None of the above') {
      setFormData({
        ...formData,
        symptoms: formData.symptoms.includes(symptom) ? [] : [symptom],
      });
    } else {
      const updatedSymptoms = formData.symptoms.includes(symptom)
        ? formData.symptoms.filter(s => s !== symptom && s !== 'None of the above')
        : [...formData.symptoms.filter(s => s !== 'None of the above'), symptom];
      
      setFormData({ ...formData, symptoms: updatedSymptoms });
    }
  };

  const generateRiskPrediction = (data: HealthFormData) => {
    let riskScore = 0;
    
    // Age factor
    const age = parseInt(data.age);
    if (age >= 45) riskScore += 20;
    else if (age >= 35) riskScore += 10;
    
    // BMI factor
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height) / 100; // convert cm to m
    if (weight && height) {
      const bmi = weight / (height * height);
      if (bmi >= 30) riskScore += 25;
      else if (bmi >= 25) riskScore += 15;
    }
    
    // Family history
    if (data.familyHistory === 'yes') riskScore += 15;
    
    // Activity level
    if (data.activityLevel === 'sedentary') riskScore += 15;
    else if (data.activityLevel === 'light') riskScore += 10;
    
    // Symptoms
    if (data.symptoms.length > 0 && !data.symptoms.includes('None of the above')) {
      riskScore += data.symptoms.length * 5;
    }
    
    // Smoking
    if (data.smokingStatus === 'current') riskScore += 10;
    else if (data.smokingStatus === 'former') riskScore += 5;
    
    // Dietary habits
    if (data.dietaryHabits === 'poor') riskScore += 10;
    else if (data.dietaryHabits === 'fair') riskScore += 5;
    
    // Cap at 100
    riskScore = Math.min(riskScore, 100);
    
    let category: 'low' | 'moderate' | 'critical';
    if (riskScore < 30) category = 'low';
    else if (riskScore < 70) category = 'moderate';
    else category = 'critical';
    
    return { riskScore, category };
  };

  const submitAssessment = async () => {
    // Validate required fields
    if (!formData.age || !formData.gender || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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

      // Create health submission
      const { data: submission, error: submissionError } = await supabase
        .from('health_submissions')
        .insert({
          patient_id: patientData.id,
          answers: formData,
          status: 'pending',
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Generate risk prediction
      const { riskScore, category } = generateRiskPrediction(formData);

      // Create risk prediction
      const { error: predictionError } = await supabase
        .from('risk_predictions')
        .insert({
          submission_id: submission.id,
          risk_score: riskScore,
          risk_category: category,
        });

      if (predictionError) throw predictionError;

      // Create initial recommendations based on risk
      const recommendations = [];
      
      if (category === 'critical') {
        recommendations.push({
          submission_id: submission.id,
          content: 'Immediate medical consultation recommended. Please see a healthcare provider within 48 hours for comprehensive diabetes screening.',
          type: 'clinical' as const,
        });
      }
      
      if (formData.activityLevel === 'sedentary') {
        recommendations.push({
          submission_id: submission.id,
          content: 'Increase physical activity to at least 150 minutes of moderate exercise per week. Start with 10-minute walks after meals.',
          type: 'lifestyle' as const,
        });
      }
      
      if (formData.dietaryHabits === 'poor') {
        recommendations.push({
          submission_id: submission.id,
          content: 'Adopt a balanced diet rich in vegetables, lean proteins, and whole grains. Limit processed foods and sugary beverages.',
          type: 'lifestyle' as const,
        });
      }

      if (recommendations.length > 0) {
        const { error: recommendationError } = await supabase
          .from('recommendations')
          .insert(recommendations);

        if (recommendationError) throw recommendationError;
      }

      Alert.alert(
        'Assessment Submitted',
        'Your health assessment has been submitted successfully. Check your dashboard for results.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ClipboardList size={24} color="#0066CC" />
        <Text style={styles.title}>Health Assessment</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder="Enter your age"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.radioGroup}>
            {['Male', 'Female', 'Other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioButton,
                  formData.gender === option.toLowerCase() && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: option.toLowerCase() })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.gender === option.toLowerCase() && styles.radioButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="70"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
              placeholder="170"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lifestyle Factors</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.radioGroup}>
            {[
              { key: 'sedentary', label: 'Sedentary' },
              { key: 'light', label: 'Light' },
              { key: 'moderate', label: 'Moderate' },
              { key: 'active', label: 'Very Active' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.radioButton,
                  formData.activityLevel === option.key && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, activityLevel: option.key })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.activityLevel === option.key && styles.radioButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dietary Habits</Text>
          <View style={styles.radioGroup}>
            {[
              { key: 'excellent', label: 'Excellent' },
              { key: 'good', label: 'Good' },
              { key: 'fair', label: 'Fair' },
              { key: 'poor', label: 'Poor' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.radioButton,
                  formData.dietaryHabits === option.key && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, dietaryHabits: option.key })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.dietaryHabits === option.key && styles.radioButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Health History</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family History of Diabetes</Text>
          <View style={styles.radioGroup}>
            {[
              { key: 'yes', label: 'Yes' },
              { key: 'no', label: 'No' },
              { key: 'unknown', label: 'Unknown' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.radioButton,
                  formData.familyHistory === option.key && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, familyHistory: option.key })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.familyHistory === option.key && styles.radioButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Symptoms (select all that apply)</Text>
          <View style={styles.checkboxGroup}>
            {symptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={[
                  styles.checkboxButton,
                  formData.symptoms.includes(symptom) && styles.checkboxButtonActive,
                ]}
                onPress={() => handleSymptomToggle(symptom)}
              >
                <Text
                  style={[
                    styles.checkboxButtonText,
                    formData.symptoms.includes(symptom) && styles.checkboxButtonTextActive,
                  ]}
                >
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Smoking Status</Text>
          <View style={styles.radioGroup}>
            {[
              { key: 'never', label: 'Never' },
              { key: 'former', label: 'Former' },
              { key: 'current', label: 'Current' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.radioButton,
                  formData.smokingStatus === option.key && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, smokingStatus: option.key })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.smokingStatus === option.key && styles.radioButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitAssessment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Send size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Assessment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  form: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  radioButtonActive: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  radioButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  radioButtonTextActive: {
    color: 'white',
  },
  checkboxGroup: {
    gap: 8,
  },
  checkboxButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkboxButtonActive: {
    borderColor: '#0066CC',
    backgroundColor: '#EBF4FF',
  },
  checkboxButtonText: {
    color: '#374151',
  },
  checkboxButtonTextActive: {
    color: '#0066CC',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
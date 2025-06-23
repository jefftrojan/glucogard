import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, TrendingUp, Plus, Target, Award, Zap, Calendar, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

interface HealthSubmission {
  id: string;
  status: 'pending' | 'reviewed';
  submitted_at: string;
  risk_predictions?: {
    risk_score: number;
    risk_category: 'low' | 'moderate' | 'critical';
  }[];
  recommendations?: {
    content: string;
    type: 'lifestyle' | 'clinical';
    created_at: string;
  }[];
}

export function PatientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<HealthSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) return;

      const { data } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          risk_predictions (
            risk_score,
            risk_category
          ),
          recommendations (
            content,
            type,
            created_at
          )
        `)
        .eq('patient_id', patientData.id)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestPrediction = () => {
    const latestSubmission = submissions[0];
    return latestSubmission?.risk_predictions?.[0];
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low':
        return '#28A745';
      case 'moderate':
        return '#FFA500';
      case 'critical':
        return '#DC3545';
      default:
        return '#64748B';
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'low':
        return CheckCircle;
      case 'moderate':
        return Clock;
      case 'critical':
        return AlertTriangle;
      default:
        return Heart;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const latestPrediction = getLatestPrediction();
  const totalRecommendations = submissions.reduce(
    (acc, sub) => acc + (sub.recommendations?.length || 0),
    0
  );

  const getMotivationalMessage = () => {
    if (!latestPrediction) return "Ready to start your health journey?";
    
    switch (latestPrediction.risk_category) {
      case 'low':
        return "Great job! Keep up the healthy habits! 🌟";
      case 'moderate':
        return "You're on the right track! Small changes make big differences 💪";
      case 'critical':
        return "Let's work together to improve your health 🎯";
      default:
        return "Every step counts towards better health! 🚀";
    }
  };

  const getHealthScore = () => {
    if (!latestPrediction) return 0;
    return Math.max(0, 100 - latestPrediction.risk_score);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroGreeting}>Hello, {user?.full_name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.heroMessage}>{getMotivationalMessage()}</Text>
        </View>
      </View>

      {/* Health Score Card */}
      {latestPrediction ? (
        <View style={styles.healthScoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreTitle}>Health Score</Text>
              <Text style={styles.scoreSubtitle}>Based on your latest assessment</Text>
            </View>
            <Award size={24} color="#FFD700" />
          </View>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{getHealthScore()}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          
          <View style={styles.riskBadge}>
            <Text style={[styles.riskText, { color: getRiskColor(latestPrediction.risk_category) }]}>
              {latestPrediction.risk_category.toUpperCase()} RISK
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.getStartedCard}>
          <View style={styles.getStartedContent}>
            <Zap size={32} color="#0066CC" />
            <Text style={styles.getStartedTitle}>Ready to Begin?</Text>
            <Text style={styles.getStartedText}>
              Take your first health assessment to unlock personalized insights
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push('/assessment')}
            >
              <Text style={styles.startButtonText}>Start Your Journey</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/assessment')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Target size={24} color="#1976D2" />
            </View>
            <Text style={styles.actionTitle}>Health Check</Text>
            <Text style={styles.actionSubtitle}>Quick assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/location')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Heart size={24} color="#388E3C" />
            </View>
            <Text style={styles.actionTitle}>Find Care</Text>
            <Text style={styles.actionSubtitle}>Nearby clinics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color="#0066CC" />
            </View>
            <Text style={styles.statNumber}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Assessments</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <CheckCircle size={20} color="#28A745" />
            </View>
            <Text style={styles.statNumber}>{totalRecommendations}</Text>
            <Text style={styles.statLabel}>Tips Received</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Calendar size={20} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{submissions.length > 0 ? Math.floor((Date.now() - new Date(submissions[0].submitted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>
      </View>

      {submissions.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {submissions.slice(0, 3).map((submission) => (
            <View key={submission.id} style={styles.historyCard}>
              <View style={styles.submissionHeader}>
                <View>
                  <Text style={styles.submissionDate}>
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </Text>
                  {submission.risk_predictions?.[0] && (
                    <Text style={styles.submissionRisk}>
                      Score: {submission.risk_predictions[0].risk_score}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    submission.status === 'reviewed'
                      ? styles.statusReviewed
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      submission.status === 'reviewed'
                        ? styles.statusTextReviewed
                        : styles.statusTextPending,
                    ]}
                  >
                    {submission.status}
                  </Text>
                </View>
              </View>
              {submission.recommendations && submission.recommendations.length > 0 && (
                <Text style={styles.submissionRecommendations}>
                  {submission.recommendations.length} recommendation(s) available
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Bottom CTA */}
      {submissions.length > 0 && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/assessment')}
        >
          <Plus size={20} color="white" />
          <Text style={styles.ctaButtonText}>Take Another Assessment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    height: 200,
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  heroMessage: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  healthScoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  scoreSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  scoreCircle: {
    alignItems: 'center',
    marginVertical: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  scoreOutOf: {
    fontSize: 16,
    color: '#64748B',
    marginTop: -8,
  },
  riskBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  getStartedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedContent: {
    padding: 24,
    alignItems: 'center',
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  getStartedText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  submissionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  submissionRisk: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusReviewed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusTextReviewed: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
  submissionRecommendations: {
    fontSize: 12,
    color: '#0066CC',
  },
  ctaButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  assessmentButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  assessmentButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  riskCard: {
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
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  riskIconContainer: {
    marginRight: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  riskCategory: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  riskScoreContainer: {
    alignItems: 'center',
  },
  riskScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  riskScoreLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newAssessmentButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    gap: 8,
    marginBottom: 24,
  },
  newAssessmentButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  }
});
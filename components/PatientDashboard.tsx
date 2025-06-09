import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {latestPrediction ? (
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <View style={styles.riskIconContainer}>
              {React.createElement(getRiskIcon(latestPrediction.risk_category), {
                size: 32,
                color: getRiskColor(latestPrediction.risk_category),
              })}
            </View>
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Latest Risk Assessment</Text>
              <Text
                style={[
                  styles.riskCategory,
                  { color: getRiskColor(latestPrediction.risk_category) },
                ]}
              >
                {latestPrediction.risk_category.toUpperCase()} RISK
              </Text>
            </View>
          </View>
          <View style={styles.riskScoreContainer}>
            <Text style={styles.riskScore}>{latestPrediction.risk_score}</Text>
            <Text style={styles.riskScoreLabel}>Risk Score</Text>
          </View>
        </View>
      ) : (
        <View style={styles.welcomeCard}>
          <Heart size={48} color="#0066CC" />
          <Text style={styles.welcomeTitle}>Welcome to GlucoGard AI</Text>
          <Text style={styles.welcomeText}>
            Take your first health assessment to get personalized diabetes risk insights
          </Text>
          <TouchableOpacity
            style={styles.assessmentButton}
            onPress={() => router.push('/assessment')}
          >
            <Plus size={20} color="white" />
            <Text style={styles.assessmentButtonText}>Start Assessment</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={24} color="#0066CC" />
          </View>
          <Text style={styles.statNumber}>{submissions.length}</Text>
          <Text style={styles.statLabel}>Assessments</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <CheckCircle size={24} color="#28A745" />
          </View>
          <Text style={styles.statNumber}>{totalRecommendations}</Text>
          <Text style={styles.statLabel}>Recommendations</Text>
        </View>
      </View>

      {submissions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Assessments</Text>
          {submissions.slice(0, 3).map((submission) => (
            <View key={submission.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionDate}>
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </Text>
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
              {submission.risk_predictions?.[0] && (
                <Text style={styles.submissionRisk}>
                  Risk Score: {submission.risk_predictions[0].risk_score} (
                  {submission.risk_predictions[0].risk_category})
                </Text>
              )}
              {submission.recommendations && submission.recommendations.length > 0 && (
                <Text style={styles.submissionRecommendations}>
                  {submission.recommendations.length} recommendation(s) available
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.newAssessmentButton}
        onPress={() => router.push('/assessment')}
      >
        <Plus size={20} color="#0066CC" />
        <Text style={styles.newAssessmentButtonText}>New Health Assessment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
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
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  submissionRisk: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  submissionRecommendations: {
    fontSize: 12,
    color: '#0066CC',
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
  },
});
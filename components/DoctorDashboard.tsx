import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle, TrendingUp, Eye } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { DoctorWebDashboard } from './DoctorWebDashboard';

interface SubmissionWithPatient {
  id: string;
  status: 'pending' | 'reviewed';
  submitted_at: string;
  patients: {
    id: string;
    profiles: {
      full_name: string;
    };
  };
  risk_predictions?: {
    risk_score: number;
    risk_category: 'low' | 'moderate' | 'critical';
  }[];
}

export function DoctorDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Use web dashboard for web platform
  if (Platform.OS === 'web') {
    return <DoctorWebDashboard />;
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          patients!inner (
            id,
            profiles!inner (
              full_name
            )
          ),
          risk_predictions (
            risk_score,
            risk_category
          )
        `)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed');
  const criticalCases = submissions.filter(
    s => s.risk_predictions?.[0]?.risk_category === 'critical'
  );

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Users size={24} color="#0066CC" />
          </View>
          <Text style={styles.statNumber}>{submissions.length}</Text>
          <Text style={styles.statLabel}>Total Submissions</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Clock size={24} color="#FFA500" />
          </View>
          <Text style={styles.statNumber}>{pendingSubmissions.length}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <AlertTriangle size={24} color="#DC3545" />
          </View>
          <Text style={styles.statNumber}>{criticalCases.length}</Text>
          <Text style={styles.statLabel}>Critical Cases</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <CheckCircle size={24} color="#28A745" />
          </View>
          <Text style={styles.statNumber}>{reviewedSubmissions.length}</Text>
          <Text style={styles.statLabel}>Reviewed</Text>
        </View>
      </View>

      {criticalCases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#DC3545" />
            <Text style={[styles.sectionTitle, { color: '#DC3545' }]}>
              Critical Cases
            </Text>
          </View>
          {criticalCases.slice(0, 3).map((submission) => (
            <TouchableOpacity
              key={submission.id}
              style={[styles.submissionCard, styles.criticalCard]}
              onPress={() => router.push(`/patients/${submission.id}`)}
            >
              <View style={styles.submissionHeader}>
                <Text style={styles.patientName}>
                  {submission.patients.profiles.full_name}
                </Text>
                <View style={styles.riskBadge}>
                  <Text style={styles.riskBadgeText}>
                    CRITICAL - {submission.risk_predictions?.[0]?.risk_score}
                  </Text>
                </View>
              </View>
              <Text style={styles.submissionDate}>
                Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
              </Text>
              <View style={styles.actionButton}>
                <Eye size={16} color="#0066CC" />
                <Text style={styles.actionButtonText}>Review Case</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Submissions</Text>
        {submissions.slice(0, 5).map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={styles.submissionCard}
            onPress={() => router.push(`/patients/${submission.id}`)}
          >
            <View style={styles.submissionHeader}>
              <Text style={styles.patientName}>
                {submission.patients.profiles.full_name}
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
              <View style={styles.riskInfo}>
                <Text style={styles.riskLabel}>Risk Assessment:</Text>
                <Text
                  style={[
                    styles.riskValue,
                    {
                      color: getRiskColor(
                        submission.risk_predictions[0].risk_category
                      ),
                    },
                  ]}
                >
                  {submission.risk_predictions[0].risk_category.toUpperCase()} (
                  {submission.risk_predictions[0].risk_score})
                </Text>
              </View>
            )}
            
            <Text style={styles.submissionDate}>
              {new Date(submission.submitted_at).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => router.push('/patients')}
      >
        <TrendingUp size={20} color="#0066CC" />
        <Text style={styles.viewAllButtonText}>View All Patients</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '47%',
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
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  riskBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC3545',
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
  riskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  riskLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  riskValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  submissionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  actionButtonText: {
    color: '#0066CC',
    fontWeight: '500',
    fontSize: 14,
  },
  viewAllButton: {
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
  viewAllButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
});
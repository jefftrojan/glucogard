import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Users,
  TrendingUp,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface PatientSubmission {
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

type FilterType = 'all' | 'pending' | 'reviewed' | 'critical';

export default function PatientsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<PatientSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<PatientSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchSubmissions();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, activeFilter]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load patient submissions');
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(submission =>
        submission.patients.profiles.full_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'pending':
        filtered = filtered.filter(s => s.status === 'pending');
        break;
      case 'reviewed':
        filtered = filtered.filter(s => s.status === 'reviewed');
        break;
      case 'critical':
        filtered = filtered.filter(s => 
          s.risk_predictions?.[0]?.risk_category === 'critical'
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredSubmissions(filtered);
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
        return Clock;
    }
  };

  const handleViewSubmission = (submissionId: string) => {
    // Navigate to submission detail (would be implemented as a modal or new screen)
    Alert.alert(
      'Submission Details',
      `This would open detailed view for submission ${submissionId}`,
      [{ text: 'OK' }]
    );
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { 
      key: 'all', 
      label: 'All', 
      count: submissions.length 
    },
    { 
      key: 'pending', 
      label: 'Pending', 
      count: submissions.filter(s => s.status === 'pending').length 
    },
    { 
      key: 'critical', 
      label: 'Critical', 
      count: submissions.filter(s => s.risk_predictions?.[0]?.risk_category === 'critical').length 
    },
    { 
      key: 'reviewed', 
      label: 'Reviewed', 
      count: submissions.filter(s => s.status === 'reviewed').length 
    },
  ];

  if (user?.role !== 'doctor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Users size={48} color="#64748B" />
          <Text style={styles.errorTitle}>Access Restricted</Text>
          <Text style={styles.errorText}>
            This section is only available for healthcare providers.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading patient submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Submissions</Text>
        <Text style={styles.subtitle}>
          {filteredSubmissions.length} of {submissions.length} submissions
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                activeFilter === filter.key && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  activeFilter === filter.key && styles.filterBadgeTextActive,
                ]}
              >
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.submissionsList} showsVerticalScrollIndicator={false}>
        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching patients' : 'No submissions found'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search terms or filters.'
                : 'Patient submissions will appear here once they complete health assessments.'
              }
            </Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => {
            const prediction = submission.risk_predictions?.[0];
            const RiskIcon = prediction ? getRiskIcon(prediction.risk_category) : Clock;
            
            return (
              <TouchableOpacity
                key={submission.id}
                style={[
                  styles.submissionCard,
                  prediction?.risk_category === 'critical' && styles.criticalCard,
                ]}
                onPress={() => handleViewSubmission(submission.id)}
              >
                <View style={styles.submissionHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {submission.patients.profiles.full_name}
                    </Text>
                    <Text style={styles.submissionDate}>
                      Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                    </Text>
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

                {prediction && (
                  <View style={styles.riskContainer}>
                    <View style={styles.riskInfo}>
                      <RiskIcon 
                        size={16} 
                        color={getRiskColor(prediction.risk_category)} 
                      />
                      <Text
                        style={[
                          styles.riskText,
                          { color: getRiskColor(prediction.risk_category) },
                        ]}
                      >
                        {prediction.risk_category.toUpperCase()} RISK
                      </Text>
                    </View>
                    <Text style={styles.riskScore}>
                      Score: {prediction.risk_score}
                    </Text>
                  </View>
                )}

                <View style={styles.actionContainer}>
                  <View style={styles.actionButton}>
                    <Eye size={16} color="#0066CC" />
                    <Text style={styles.actionButtonText}>Review Details</Text>
                  </View>
                  {prediction?.risk_category === 'critical' && (
                    <View style={styles.urgentBadge}>
                      <AlertTriangle size={12} color="#DC3545" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filtersContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: 'white',
  },
  submissionsList: {
    flex: 1,
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusReviewed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusTextReviewed: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
  },
  riskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC3545',
  },
});
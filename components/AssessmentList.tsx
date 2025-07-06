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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { type Json } from '@/types/database';

interface Assessment {
  id: string;
  patient_id: string;
  answers: Json;
  status: string | null;
  submitted_at: string | null;
}

const AssessmentList = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('health_submissions')
            .select('*')
            .eq('patient_id', user.id);

          if (error) {
            console.error('Error fetching assessments:', error);
          } else {
            setAssessments(data as Assessment[] || []);
          }
        } catch (error) {
          console.error('Unexpected error fetching assessments:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAssessments();
  }, [user]);

  const navigateToAssessmentDetails = (assessmentId: string) => {
    router.push(`/(tabs)/AssessmentDetailsScreen?id=${assessmentId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.assessmentTitle}>Your Assessments</Text>
      <ScrollView style={styles.assessmentList}>
        {assessments.map((assessment) => (
          <TouchableOpacity
            key={assessment.id}
            style={styles.assessmentItem}
            onPress={() => navigateToAssessmentDetails(assessment.id)}
          >
            <Text style={styles.assessmentItemText}>Assessment {assessment.id}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  assessmentList: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  assessmentItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assessmentItemText: {
    fontSize: 16,
    color: '#1E293B',
  },
});

export default AssessmentList;

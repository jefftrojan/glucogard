import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, AlertTriangle, Clock, CheckCircle, TrendingUp, Eye, MessageSquare, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface SubmissionWithPatient {
  id: string;
  status: 'pending' | 'reviewed';
  submitted_at: string;
  notes?: string;
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

export default function DoctorDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSort, setSelectedSort] = useState<'date' | 'name' | 'risk'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithPatient | null>(null);
  const [noteText, setNoteText] = useState('');

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
          notes,
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

  const sortSubmissions = (list: SubmissionWithPatient[]) => {
    switch (selectedSort) {
      case 'name':
        return list.sort((a, b) => a.patients.profiles.full_name.localeCompare(b.patients.profiles.full_name));
      case 'risk':
        return list.sort((a, b) => (b.risk_predictions?.[0]?.risk_score || 0) - (a.risk_predictions?.[0]?.risk_score || 0));
      default:
        return list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    }
  };

  const filtered = submissions.filter(s =>
    s.patients.profiles.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortSubmissions(filtered);
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openDetail = (submission: SubmissionWithPatient) => {
    setSelectedSubmission(submission);
    setNoteText(submission.notes || '');
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!selectedSubmission) return;
    const { error } = await supabase
      .from('health_submissions')
      .update({ notes: noteText })
      .eq('id', selectedSubmission.id);

    if (!error) {
      fetchSubmissions();
      setModalVisible(false);
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
    <View style={styles.container}>
      <View style={styles.searchSortRow}>
        <TextInput
          placeholder="Search patient..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={() => setSelectedSort('date')}><Text>Date</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedSort('name')}><Text>Name</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedSort('risk')}><Text>Risk</Text></TouchableOpacity>
      </View>

      <FlatList
        data={paginated}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetail(item)} style={styles.card}>
            <Text style={styles.name}>{item.patients.profiles.full_name}</Text>
            <Text>{item.status.toUpperCase()} | {item.risk_predictions?.[0]?.risk_category.toUpperCase()}</Text>
            <Text>{new Date(item.submitted_at).toLocaleDateString()}</Text>
        
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <MessageSquare size={18} color="#0066CC" />
              
              <TouchableOpacity
                onPress={() => router.push(`/chat/${item.patients.id}`)}
                style={{ padding: 8 }}
              >
                <MessageCircle size={20} color="#0066CC" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.pagination}>
        <TouchableOpacity onPress={() => setCurrentPage(p => Math.max(1, p - 1))}><Text>Prev</Text></TouchableOpacity>
        <Text>Page {currentPage}</Text>
        <TouchableOpacity onPress={() => setCurrentPage(p => p + 1)}><Text>Next</Text></TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Submission Detail</Text>
          <Text>{selectedSubmission?.patients.profiles.full_name}</Text>
          <Text>Status: {selectedSubmission?.status}</Text>
          <Text>Risk: {selectedSubmission?.risk_predictions?.[0]?.risk_category}</Text>

          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Add notes..."
            value={noteText}
            onChangeText={setNoteText}
            style={styles.noteInput}
          />

          <TouchableOpacity onPress={saveNote}><Text>Save Note</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}><Text>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 12,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  searchSortRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
  },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: 'white' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  noteInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

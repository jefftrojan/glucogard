// DoctorDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageSquare, Eye, MessageCircle,Users, Clock, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface SubmissionWithPatient {
  id: string;
  status: string | null;
  submitted_at?: string | null;
  notes?: string;
  patient_id?: string;
  patients?: {
    id: string;
    profiles: {
      full_name: string;
    };
  };
  risk_predictions?: {
    risk_score: number;
    risk_category: string;
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
      const { data: submissionsData } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          patient_id,
          risk_predictions (
            risk_score,
            risk_category
          )
        `)
        .order('submitted_at', { ascending: false });

      const patientIds = submissionsData?.map(s => s.patient_id) ?? [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name
        `)
        .in('id', patientIds);

      const submissionsWithPatients = submissionsData?.map(submission => {
        const profile = profilesData?.find(p => p.id === submission.patient_id);
        const patient = {
          id: submission.patient_id,
          profiles: {
            full_name: profile?.full_name ?? 'Unknown Patient'
          }
        };
        return { ...submission, patients: patient };
      }) ?? [];

      setSubmissions(submissionsWithPatients);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortSubmissions = (list: SubmissionWithPatient[]) => {
    switch (selectedSort) {
      case 'name':
        return [...list].sort((a, b) => (a.patients?.profiles.full_name ?? '').localeCompare(b.patients?.profiles.full_name ?? ''));
      case 'risk':
        return [...list].sort((a, b) => (b.risk_predictions?.[0]?.risk_score || 0) - (a.risk_predictions?.[0]?.risk_score || 0));
      default:
        return [...list].sort((a, b) => (new Date(b.submitted_at ?? '').getTime() - new Date(a.submitted_at ?? '').getTime()));
    }
  };

  const filtered = submissions.filter(s =>
    (s.patients?.profiles.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortSubmissions(filtered);
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openDetail = (submission: SubmissionWithPatient) => {
    setSelectedSubmission(submission);
    setNoteText('');
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!selectedSubmission) return;
    // The 'notes' field does not exist in the table, so this function is a no-op.
    setModalVisible(false);
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
        {['date', 'name', 'risk'].map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => setSelectedSort(option as 'date' | 'name' | 'risk')}
            style={[
              styles.sortButton,
              selectedSort === option && styles.sortButtonActive
            ]}
          >
            <Text style={selectedSort === option ? styles.sortTextActive : styles.sortText}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={paginated}
        keyExtractor={item => item.id}
renderItem={({ item }) => (
  <View style={styles.card}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Users size={30} color="#0066CC" />
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.name}>{item.patients?.profiles.full_name ?? 'Unknown Patient'}</Text>
        <Text style={styles.dateText}>
          <Clock size={12} color="#999" /> {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'Unknown Date'}
        </Text>
      </View>
    </View>

    <View style={styles.cardRow}>
      <Text style={styles.statusBadge}>{item.status ?? 'N/A'}</Text>
      <Text style={styles.riskBadge}>
        {item.risk_predictions?.[0]?.risk_category?.toUpperCase() ?? 'N/A'}
      </Text>
    </View>

    <View style={styles.cardRow}>
      <TrendingUp size={16} color="#FF6B6B" />
      <Text style={styles.scoreText}>
        Risk Score: {item.risk_predictions?.[0]?.risk_score ?? 'N/A'}
      </Text>
    </View>

    <View style={styles.cardFooter}>
        <TouchableOpacity 
          onPress={() => {
            const patientId = item.patients?.id;
            if (patientId) {
              router.push(`/chat/${patientId}`);
            } else {
              alert('Patient ID missing, cannot open chat');
            }
          }}
          
          style={styles.actionButton}
        >
        <MessageCircle size={20} color="#0066CC" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => openDetail(item)}
        style={styles.actionButton}
      >
        <Eye size={20} color="#555" />
      </TouchableOpacity>
    </View>
  </View>
)}
        
      />

      {/* Custom Pagination */}
      <View style={styles.customPagination}>
        <TouchableOpacity onPress={() => setCurrentPage(p => Math.max(1, p - 1))}>
          <Text style={styles.paginationButton}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.paginationText}>Page {currentPage}</Text>
        <TouchableOpacity onPress={() => setCurrentPage(p => p + 1)}>
          <Text style={styles.paginationButton}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Submission Detail</Text>
          <Text>{selectedSubmission?.patients?.profiles.full_name ?? 'Unknown Patient'}</Text>
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

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={saveNote} style={styles.saveButton}>
              <Text style={styles.buttonText}>Save Note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#f9f9f9',
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  subInfo: { color: '#444', marginTop: 4 },
  date: { color: '#888', fontSize: 12, marginTop: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  searchSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  sortButtonActive: {
    backgroundColor: '#0066CC',
  },
  sortText: {
    color: '#333',
  },
  sortTextActive: {
    color: 'white',
  },
  customPagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 12,
  },
  paginationButton: {
    fontWeight: 'bold',
    color: '#0066CC',
  },
  paginationText: {
    fontSize: 16,
  },
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  
  
  dateText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  scoreText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#444',
  },
  statusBadge: {
    backgroundColor: '#C8E6C9', // Default for reviewed
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#333',
    fontWeight: '600',
  },
  riskBadge: {
    backgroundColor: '#E0E0E0', // Default
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#333',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  

});

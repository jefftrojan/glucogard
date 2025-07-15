// ChatScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Send, ArrowLeft, User, Stethoscope, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database';

type Message = Tables<'messages'>;

interface Patient {
  id: string;
  profiles: {
    full_name: string;
  };
}

interface Doctor {
  id: string;
  profiles: {
    full_name: string;
  };
}

export default function ChatScreen() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  // Memoize the message handler to prevent unnecessary re-subscriptions
  const handleNewMessage = useCallback((payload: any) => {
    setMessages((prev) => [...prev, payload.new as Message]);
    scrollToBottom();
  }, []);

  const fetchChatContext = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('User not authenticated. Please log in.');

      const { data, error } = await supabase.rpc('get_chat_context', {
        p_patient_id: patientId,
        d_user_id: authData.user.id,
      });

      if (error) throw error;

      if (data) {
        const chatContext = data as unknown as {
          patient: Patient | null;
          doctor: Doctor | null;
        };
        if (!chatContext.patient || !chatContext.doctor) {
          throw new Error('Could not load patient or doctor information. The user may not exist or you may not have permission.');
        }
        setPatient(chatContext.patient);
        setCurrentDoctor(chatContext.doctor);
        return true;
      }
      // if data is null
      throw new Error('Failed to retrieve chat context from the server.');
    } catch (err) {
      console.error('Error fetching chat context:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading chat information.';
      setError(errorMessage);
      return false;
    }
  }, [patientId]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages.';
      setError(errorMessage);
    }
  }, [patientId]);

  const subscribeToMessages = useCallback(() => {
    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`chat:${patientId}:${Date.now()}`) // Add timestamp to ensure unique channel names
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `patient_id=eq.${patientId}`,
        },
        handleNewMessage
      )
      .subscribe();

    channelRef.current = channel;
    return channel;
  }, [patientId, handleNewMessage]);

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided.");
      setLoading(false);
      return;
    }

    const loadChatData = async () => {
      setLoading(true);
      setError(null);

      const contextSuccess = await fetchChatContext();
      if (contextSuccess) {
        await fetchMessages();
        subscribeToMessages();
      }
      
      setLoading(false);
    };

    loadChatData();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [patientId, fetchChatContext, fetchMessages, subscribeToMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentDoctor || sending) return;

    setSending(true);
    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('patient_id', patientId)
        .eq('doctor_id', currentDoctor.id)
        .single();

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      let chatId = chat?.id;
      if (!chatId) {
        const { data: newChat, error: newChatError } = await supabase
          .from('chats')
          .insert({
            patient_id: patientId!,
            doctor_id: currentDoctor.id,
          })
          .select('id')
          .single();

        if (newChatError) throw newChatError;
        chatId = newChat.id;
      }

      const { error } = await supabase.from('messages').insert({
        message: newMessage.trim(),
        sender_id: currentDoctor.id,
        patient_id: patientId!,
        chat_id: chatId,
        sender_type: 'doctor',
      });

      if (error) throw error;
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!currentDoctor || !patient) {
      return null; // Don't render messages until context is loaded
    }
    const isDoctor = item.sender_id === currentDoctor?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isDoctor ? styles.doctorMessage : styles.patientMessage,
        ]}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            {isDoctor ? (
              <Stethoscope size={16} color="#0066CC" />
            ) : (
              <User size={16} color="#666" />
            )}
            <Text style={styles.senderName}>
              {isDoctor
                ? 'Dr. ' + (currentDoctor?.profiles.full_name || 'Doctor')
                : patient?.profiles.full_name || 'Patient'}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#999" />
            <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.messageContent}>{item.message}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#0066CC" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <User size={24} color="#0066CC" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {patient?.profiles.full_name || 'Patient'}
            </Text>
            <Text style={styles.headerSubtitle}>Patient Chat</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollToBottom()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with your patient</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  doctorMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066CC',
  },
  patientMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const patientId = params.patientId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !patientId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from<Message>('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${patientId}),and(sender_id.eq.${patientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      }
    };

    fetchMessages();

    const subscription = supabase
      .from(`messages:receiver_id=eq.${user.id}`)
      .on('INSERT', payload => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === patientId && newMsg.receiver_id === user.id) ||
          (newMsg.sender_id === user.id && newMsg.receiver_id === patientId)
        ) {
          setMessages(prev => [...prev, newMsg]);
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [user, patientId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: patientId,
        content: newMessage.trim(),
      },
    ]);

    if (!error) {
      setNewMessage('');
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.theirMessage]}>
        <Text style={isMine ? styles.myText : styles.theirText}>{item.content}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type your message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    maxWidth: '75%',
  },
  myMessage: {
    backgroundColor: '#0066CC',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  myText: { color: 'white' },
  theirText: { color: 'black' },
  timestamp: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

import PopButton from '../../utils/PopButton';

export default function SupportScreen() {
  const { user } = useUser();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // 1. Initialize Chat
  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      try {
        if (!user) return;
        const { data: existingConv, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'open')
          .maybeSingle();

        if (fetchError) throw fetchError;
        let convId = existingConv?.id;

        if (!convId) {
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert([{ user_id: user.id }])
            .select()
            .single();

          if (createError) throw createError;
          convId = newConv.id;
        }

        if (isMounted && convId) {
          setConversationId(convId);
          await fetchMessages(convId);
        }
      } catch (error: any) {
        console.error('Chat Init Error:', error.message);
        Alert.alert('Error', 'Could not connect to support.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initChat();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          setMessages(prev => [...prev, payload.new]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 3. Auto-Scroll on Keyboard Show
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      },
    );
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

  // 4. Fetch History
  const fetchMessages = async (convId: number) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
    }
  };

  // 5. Send Message
  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;
    const msgText = input.trim();
    setInput('');
    const { error } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: 'user',
        message_text: msgText,
      },
    ]);
    if (error) {
      Alert.alert('Error', 'Failed to send message');
      setInput(msgText);
    }
  };

  const renderItem = ({ item }: any) => {
    const isUser = item.sender_type === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.adminBubble,
        ]}
      >
        <Text style={[styles.messageText, !isUser && styles.adminText]}>
          {item.message_text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Android: Transparent status bar for the gradient to look nice */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* HEADER: Fixed at top */}
      <LinearGradient
        colors={['#340052ff', '#a700b6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Customer Support</Text>
          {loading && <ActivityIndicator size="small" color="#fff" />}
        </View>
      </LinearGradient>

      {/* CHAT AREA: Android Only Config */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="height" // Best for Android
      >
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ padding: s(15), paddingBottom: vs(20) }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        </View>

        {/* INPUT AREA */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor="#8f7297"
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <PopButton onPress={sendMessage} disabled={loading}>
              <LinearGradient
                colors={['#340052ff', '#a200b1ff']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButton}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </LinearGradient>
            </PopButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- HEADER ---
  headerGradient: {
    paddingTop: vs(40), // Standard Android Status Bar Padding
    paddingBottom: vs(25),
    paddingHorizontal: s(20),
    borderBottomLeftRadius: ms(100),
    borderBottomRightRadius: ms(100),
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  // --- CHAT ---
  listContainer: {
    flex: 1,
  },
  messageBubble: {
    padding: s(12),
    borderRadius: ms(15),
    marginVertical: vs(4),
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#64008b15',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: '#6c008d30',
  },
  adminBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: ms(15),
    color: '#333',
  },
  adminText: {
    color: '#333',
  },
  // --- INPUT ---
  inputWrapper: {
    padding: s(15),
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f6e6fdff',
    borderRadius: ms(25),
    paddingHorizontal: s(15),
    paddingVertical: vs(10),
    minHeight: vs(45),
    marginRight: s(10),
    color: '#333',
  },
  sendButton: {
    width: s(60),
    height: vs(45),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(25),
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: ms(14),
  },
});

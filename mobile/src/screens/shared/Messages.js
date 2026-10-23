import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { expertChatAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Messages({ navigation, route }) {
  const { user } = useAuth();
  const chatId = route?.params?.chatId;
  const otherUser = route?.params?.otherUser;

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(chatId ? 'chat' : 'list');
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [activeOther, setActiveOther] = useState(otherUser);
  const flatRef = useRef();

  useEffect(() => {
    if (view === 'list') loadChats();
    if (view === 'chat' && activeChatId) loadMessages(activeChatId);
  }, [view, activeChatId]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await expertChatAPI.getMyChats();
      setChats(res.data.chats || []);
    } catch {}
    setLoading(false);
  };

  const loadMessages = async (id) => {
    setLoading(true);
    try {
      const res = await expertChatAPI.getChatHistory(id);
      setMessages(res.data.messages || []);
    } catch {}
    setLoading(false);
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const txt = input.trim();
    setInput('');
    setSending(true);
    try {
      await expertChatAPI.sendMessage(activeChatId, txt);
      loadMessages(activeChatId);
    } catch {}
    setSending(false);
  };

  const openChat = (chat) => {
    const other = chat.participants?.find(p => p._id !== user?._id);
    setActiveChatId(chat._id);
    setActiveOther(other?.name || 'Chat');
    setView('chat');
  };

  if (view === 'chat') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
          <TouchableOpacity onPress={() => { if (chatId) navigation.goBack(); else setView('list'); }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeOther || 'Chat'}</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} /> : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: spacing.md }}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isMe = item.sender?._id === user?._id || item.sender === user?._id;
                return (
                  <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem, shadows.sm]}>
                      {!isMe && <Text style={styles.senderName}>{item.sender?.name || 'Them'}</Text>}
                      <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text || item.content}</Text>
                      <Text style={styles.msgTime}>{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Start the conversation!</Text></View>}
            />
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.5 }]} onPress={send} disabled={!input.trim() || sending}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.sendGrad}>
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, marginTop: 40 }} /> : (
        <FlatList
          data={chats}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubbles-outline" size={48} color={colors.border} /><Text style={styles.emptyText}>No conversations yet.</Text></View>}
          renderItem={({ item }) => {
            const other = item.participants?.find(p => p._id !== user?._id);
            const last = item.lastMessage;
            return (
              <TouchableOpacity style={[styles.chatRow, shadows.sm]} onPress={() => openChat(item)}>
                <View style={styles.chatAvatar}><Ionicons name="person" size={22} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatName}>{other?.name || 'User'}</Text>
                  <Text style={styles.chatLast} numberOfLines={1}>{last?.text || last?.content || 'Start chatting...'}</Text>
                </View>
                {last?.createdAt && <Text style={styles.chatTime}>{new Date(last.createdAt).toLocaleDateString()}</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  msgRow: { flexDirection: 'row', marginBottom: spacing.sm },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: borderRadius.lg, padding: spacing.md },
  bubbleThem: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  senderName: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text, maxHeight: 120, borderWidth: 1, borderColor: colors.border },
  sendBtn: { borderRadius: borderRadius.round, overflow: 'hidden' },
  sendGrad: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chatAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '700', color: colors.text },
  chatLast: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chatTime: { fontSize: 10, color: colors.textMuted },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
});

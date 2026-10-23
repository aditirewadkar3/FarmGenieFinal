import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { geminiAPI, cropAPI, weatherAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function AIChat({ navigation }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! I'm KrishiBandhu AI 🌾 — your smart farming assistant.\n\nI can help you with:\n• 🌿 Crop disease information\n• 📈 Market price advice\n• 🌤 Weather-based farming tips\n• 🧑‍🌾 Agronomist guidance\n\nWhat's on your mind today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef();

  const QUICK = [
    'What pesticide for tomato blight?',
    'Best time to sow wheat?',
    'How to improve soil quality?',
    'Signs of nitrogen deficiency?',
  ];

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setSending(true);

    try {
      // Build context from crops/weather
      let context = `User: ${user?.name}, Farmer. Language: ${language}.`;
      try {
        const crops = await cropAPI.getCrops();
        if (crops.data.crops?.length) {
          context += ` Crops: ${crops.data.crops.map(c => c.cropName).join(', ')}.`;
        }
      } catch {}

      const history = updated.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await geminiAPI.chat(history, context, language);
      const reply = res.data?.reply || res.data?.message || 'I could not process your request. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please check your internet and try again.' }]);
    }
    setSending(false);
  };

  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="leaf" size={16} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, shadows.sm]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>KrishiBandhu AI</Text>
          <Text style={styles.headerSub}>Your farming assistant</Text>
        </View>
        <View style={styles.onlineDot} />
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          renderItem={renderMessage}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickWrap}>
            {QUICK.map(q => (
              <TouchableOpacity key={q} style={[styles.quickChip, shadows.sm]} onPress={() => sendMessage(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {sending && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}><Ionicons name="leaf" size={16} color={colors.primary} /></View>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about farming..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || sending}
          >
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.sendGrad}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A5D6A7', marginLeft: 'auto' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.sm },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  bubble: { maxWidth: '80%', borderRadius: borderRadius.lg, padding: spacing.md },
  bubbleBot: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  quickWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  quickChip: { backgroundColor: colors.card, borderRadius: borderRadius.round, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  quickText: { fontSize: 12, color: colors.primaryDark, fontWeight: '600' },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text, maxHeight: 120, borderWidth: 1, borderColor: colors.border },
  sendBtn: { borderRadius: borderRadius.round, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendGrad: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});

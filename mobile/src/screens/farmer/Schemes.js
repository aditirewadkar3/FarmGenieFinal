import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  SafeAreaView, TouchableOpacity, Linking, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { schemeAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Schemes({ navigation }) {
  const { t, language, languages, changeLanguage } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      console.log('[Schemes] Fetching schemes for language:', language);
      const res = await schemeAPI.getRecommendations(language);
      console.log('[Schemes] Raw response data:', JSON.stringify(res.data).substring(0, 100));
      const schemeData = res.data.recommendations || res.data.schemes || (Array.isArray(res.data) ? res.data : []);
      console.log('[Schemes] Schemes loaded:', schemeData.length);
      setSchemes(schemeData);
    } catch (err) {
      console.error('[Schemes] Error fetching schemes:', err.response?.data || err.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchSchemes(); }, [language]);

  const SCHEME_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#009688', '#FF5722', '#607D8B'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8E24AA', '#AB47BC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Government Schemes')}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Language toggle */}
      <View style={styles.langRow}>
        <Text style={styles.langLabel}>Language:</Text>
        {Object.values(languages).map(l => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langChip, language === l.code && styles.langChipActive]}
            onPress={() => changeLanguage(l.code)}
          >
            <Text style={[styles.langChipText, language === l.code && styles.langChipTextActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Badge */}
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={14} color="#8E24AA" />
        <Text style={styles.aiText}>{t('AI Recommended')} — Personalized based on your farm profile</Text>
      </View>

      {loading ? (
        <View style={styles.loadWrap}><ActivityIndicator size="large" color="#8E24AA" /></View>
      ) : (
        <FlatList
          data={schemes}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchemes(); }} colors={['#8E24AA']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No schemes found. Try changing the language or check back later.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const color = SCHEME_COLORS[index % SCHEME_COLORS.length];
            const isExpanded = expanded === index;
            return (
              <TouchableOpacity
                style={[styles.schemeCard, shadows.sm]}
                onPress={() => setExpanded(isExpanded ? null : index)}
                activeOpacity={0.9}
              >
                <View style={styles.schemeHeader}>
                  <View style={[styles.schemeIconBg, { backgroundColor: `${color}20` }]}>
                    <Ionicons name="ribbon" size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.schemeName}>{item.name || item.title}</Text>
                    {item.ministry && <Text style={styles.schemeMinistry}>{item.ministry}</Text>}
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </View>

                {item.amount && (
                  <View style={[styles.amountBadge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
                    <Text style={[styles.amountText, { color }]}>💰 {item.amount}</Text>
                  </View>
                )}

                {isExpanded && (
                  <View style={styles.schemeDetails}>
                    {item.description && <Text style={styles.schemeDesc}>{item.description}</Text>}
                    {item.eligibility && (
                      <View style={styles.schemeSection}>
                        <Text style={styles.schemeSectionTitle}>Eligibility:</Text>
                        <Text style={styles.schemeSectionText}>{item.eligibility}</Text>
                      </View>
                    )}
                    {item.benefits && (
                      <View style={styles.schemeSection}>
                        <Text style={styles.schemeSectionTitle}>Benefits:</Text>
                        <Text style={styles.schemeSectionText}>{item.benefits}</Text>
                      </View>
                    )}
                    {item.link && (
                      <TouchableOpacity style={styles.schemeLink} onPress={() => Linking.openURL(item.link)}>
                        <Ionicons name="open-outline" size={16} color="#8E24AA" />
                        <Text style={styles.schemeLinkText}>View Official Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
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
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  langLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  langChip: { paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  langChipActive: { borderColor: '#8E24AA', backgroundColor: '#F3E5F5' },
  langChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  langChipTextActive: { color: '#8E24AA', fontWeight: '700' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#F3E5F5', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#E1BEE7' },
  aiText: { fontSize: 12, color: '#8E24AA', fontWeight: '600' },
  schemeCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  schemeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  schemeIconBg: { width: 44, height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  schemeName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  schemeMinistry: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  amountBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.round, borderWidth: 1, alignSelf: 'flex-start', marginTop: spacing.sm },
  amountText: { fontSize: 12, fontWeight: '700' },
  schemeDetails: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  schemeDesc: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },
  schemeSection: { marginBottom: spacing.sm },
  schemeSectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  schemeSectionText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  schemeLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  schemeLinkText: { fontSize: 13, color: '#8E24AA', fontWeight: '600', textDecorationLine: 'underline' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

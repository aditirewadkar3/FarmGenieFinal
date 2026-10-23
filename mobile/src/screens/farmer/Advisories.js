import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { agronomistAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Advisories({ navigation }) {
  const [advisories, setAdvisories] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('advisories');

  const load = async () => {
    try {
      const res = await agronomistAPI.findLocalExperts();
      setExperts(res.data.agronomists || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#5C6BC0', '#7986CB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Advisories & Experts</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {loading ? <ActivityIndicator size="large" color="#5C6BC0" style={{ flex: 1 }} /> : (
        <FlatList
          data={experts}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#5C6BC0']} />}
          ListHeaderComponent={
            <View style={[styles.infoCard, shadows.sm]}>
              <Ionicons name="information-circle" size={22} color="#5C6BC0" />
              <Text style={styles.infoText}>Connect with local agronomists for expert crop advice tailored to your region.</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No local experts found in your area yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.expertCard, shadows.sm]}>
              <View style={styles.expertAvatarBg}>
                <Ionicons name="person" size={28} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expertName}>{item.name}</Text>
                <Text style={styles.expertSpec}>{item.specialization || 'General Agriculture'}</Text>
                {item.languages?.length ? <Text style={styles.expertLang}>🗣 {item.languages.join(', ')}</Text> : null}
                {item.rating ? <Text style={styles.expertRating}>⭐ {item.rating}/5</Text> : null}
              </View>
              <View style={[styles.verifyBadge, { backgroundColor: item.verified ? '#E8F5E9' : '#FFF8E1' }]}>
                <Ionicons name={item.verified ? 'shield-checkmark' : 'time'} size={14} color={item.verified ? colors.success : colors.warning} />
                <Text style={[styles.verifyText, { color: item.verified ? colors.success : colors.warning }]}>
                  {item.verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  infoCard: { backgroundColor: '#EDE7F6', borderRadius: borderRadius.lg, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.md, borderWidth: 1, borderColor: '#D1C4E9' },
  infoText: { flex: 1, fontSize: 13, color: '#4527A0', lineHeight: 19 },
  expertCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  expertAvatarBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  expertName: { fontSize: 15, fontWeight: '700', color: colors.text },
  expertSpec: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  expertLang: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  expertRating: { fontSize: 11, color: colors.textMuted },
  verifyBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.round },
  verifyText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

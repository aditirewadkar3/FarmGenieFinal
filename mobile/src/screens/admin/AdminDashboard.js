import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, p] = await Promise.allSettled([adminAPI.getStats(), adminAPI.getPendingUsers()]);
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (p.status === 'fulfilled') setPendingUsers(p.value.data.users || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (userId, name) => {
    try {
      await adminAPI.approveUser(userId);
      Alert.alert('✅ Approved', `${name} has been approved!`);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
    } catch { Alert.alert('Error', 'Could not approve user.'); }
  };

  const reject = async (userId, name) => {
    Alert.alert('Reject User', `Reject ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try { await adminAPI.rejectUser(userId); setPendingUsers(prev => prev.filter(u => u._id !== userId)); } catch {}
      }}
    ]);
  };

  const ADMIN_LINKS = [
    { label: 'Farmers', screen: 'Farmers', icon: 'leaf', color: colors.primary, bg: colors.primaryPale },
    { label: 'Agronomists', screen: 'Agronomists', icon: 'school', color: '#5C6BC0', bg: '#EDE7F6' },
    { label: 'Seeds', screen: 'Seeds', icon: 'nutrition', color: '#FF9800', bg: '#FFF3E0' },
    { label: 'Fertilizers', screen: 'Fertilizers', icon: 'flask', color: '#009688', bg: '#E0F2F1' },
    { label: 'Facilities', screen: 'Facilities', icon: 'business', color: '#F44336', bg: '#FFEBEE' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#E53935']} />}>
        <LinearGradient colors={['#E53935', '#EF5350']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Admin Panel</Text>
              <Text style={styles.name}>{user?.name}</Text>
            </View>
            <View style={styles.shield}><Ionicons name="shield-checkmark" size={28} color="#E53935" /></View>
          </View>
          {stats && (
            <View style={styles.statsRow}>
              {[
                { label: 'Farmers', val: stats.totalFarmers || 0 },
                { label: 'Retailers', val: stats.totalRetailers || 0 },
                { label: 'Agronomists', val: stats.totalAgronomists || 0 },
                { label: 'Pending', val: pendingUsers.length },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <View style={styles.stat}><Text style={styles.statVal}>{s.val}</Text><Text style={styles.statLabel}>{s.label}</Text></View>
                  {i < arr.length - 1 && <View style={styles.statDiv} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Approvals ({pendingUsers.length})</Text>
            {pendingUsers.slice(0, 5).map(u => (
              <View key={u._id} style={[styles.pendingCard, shadows.sm]}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{u.name}</Text>
                  <Text style={styles.pendingRole}>{u.role} · {u.mobileNumber}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approve(u._id, u.name)}>
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(u._id, u.name)}>
                    <Ionicons name="close" size={18} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Manage Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.grid}>
            {ADMIN_LINKS.map(l => (
              <TouchableOpacity key={l.label} style={[styles.linkCard, shadows.sm]} onPress={() => navigation.navigate(l.screen)} activeOpacity={0.8}>
                <View style={[styles.linkIcon, { backgroundColor: l.bg }]}><Ionicons name={l.icon} size={26} color={l.color} /></View>
                <Text style={styles.linkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { paddingBottom: spacing.xl }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} /><Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  shield: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, padding: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#FFE082', borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  pendingInfo: { flex: 1 },
  pendingName: { fontSize: 14, fontWeight: '700', color: colors.text },
  pendingRole: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize', marginTop: 2 },
  pendingActions: { flexDirection: 'row', gap: spacing.sm },
  approveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  linkCard: { width: '30%', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  linkIcon: { width: 50, height: 50, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  linkLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: borderRadius.lg },
  logoutText: { fontSize: 15, color: colors.error, fontWeight: '700' },
});

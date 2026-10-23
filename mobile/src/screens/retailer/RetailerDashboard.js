import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplyChainAPI, marketAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function RetailerDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ listings: 0, requests: 0 });

  useEffect(() => {
    Promise.allSettled([supplyChainAPI.getMyCollaborations()]).then(([s]) => {
      if (s.status === 'fulfilled') setStats({ requests: s.value.data.total || 0, accepted: s.value.data.accepted || 0 });
    }).finally(() => setLoading(false));
  }, []);

  const QUICK = [
    { label: 'Marketplace', screen: 'Marketplace', icon: 'storefront', color: '#FB8C00', bg: '#FFF3E0' },
    { label: 'Connected\nFarmers', screen: 'Connected Farmers', icon: 'people', color: colors.primary, bg: '#EAF5EA' },
    { label: 'Messages', screen: 'Messages', icon: 'chatbubbles', color: '#1E88E5', bg: '#E3F2FD' },
    { label: 'Profile', screen: 'Profile', icon: 'person', color: '#8E24AA', bg: '#F3E5F5' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LinearGradient colors={['#FB8C00', '#FFA726']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back 👋</Text>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.role}>Retailer</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
              <Ionicons name="storefront" size={26} color="#FB8C00" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statVal}>{stats.requests}</Text><Text style={styles.statLabel}>Total Requests</Text></View>
            <View style={styles.statDiv} />
            <View style={styles.stat}><Text style={styles.statVal}>{stats.accepted || 0}</Text><Text style={styles.statLabel}>Accepted</Text></View>
            <View style={styles.statDiv} />
            <View style={styles.stat}><Text style={styles.statVal}>{user?.location?.state || '--'}</Text><Text style={styles.statLabel}>State</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {QUICK.map(q => (
              <TouchableOpacity key={q.label} style={[styles.qCard, shadows.sm]} onPress={() => navigation.navigate(q.screen)} activeOpacity={0.8}>
                <View style={[styles.qIcon, { backgroundColor: q.bg }]}><Ionicons name={q.icon} size={26} color={q.color} /></View>
                <Text style={styles.qLabel}>{q.label}</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  role: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, padding: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  qCard: { width: '47%', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  qIcon: { width: 52, height: 52, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  qLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: borderRadius.lg },
  logoutText: { fontSize: 15, color: colors.error, fontWeight: '700' },
});

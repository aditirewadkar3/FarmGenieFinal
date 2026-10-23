import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { agronomistAPI, diseaseReportAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function AgronomistDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [f, a] = await Promise.allSettled([
        agronomistAPI.findLocalFarmers(),
        diseaseReportAPI.getReports(),
      ]);
      if (f.status === 'fulfilled') setFarmers(f.value.data.farmers || []);
      if (a.status === 'fulfilled') {
        const active = (a.value.data.diseaseReports || []).filter(r => !r.treated);
        setAlerts(active.slice(0, 5));
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}>
        <LinearGradient colors={['#5C6BC0', '#7986CB']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Agronomist Dashboard</Text>
              <Text style={styles.name}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
              <Ionicons name="school" size={24} color="#5C6BC0" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statVal}>{farmers.length}</Text><Text style={styles.statLabel}>Local Farmers</Text></View>
            <View style={styles.statDiv} />
            <View style={styles.stat}><Text style={styles.statVal}>{alerts.length}</Text><Text style={styles.statLabel}>Active Alerts</Text></View>
          </View>
        </LinearGradient>

        {/* Disease Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Active Disease Alerts</Text>
            {alerts.map(a => (
              <View key={a._id} style={[styles.alertCard, shadows.sm]}>
                <Ionicons name="warning" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertCrop}>{a.cropName}</Text>
                  <Text style={styles.alertDisease}>{a.diseaseName || 'Disease Detected'}</Text>
                </View>
                <Text style={styles.alertDate}>{new Date(a.createdAt).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Local Farmers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Farmers ({farmers.length})</Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : (
            <FlatList
              data={farmers}
              keyExtractor={i => i._id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No farmers found in your area.</Text>}
              renderItem={({ item }) => (
                <View style={[styles.farmerCard, shadows.sm]}>
                  <View style={styles.farmerIcon}><Ionicons name="person" size={22} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.farmerName}>{item.name}</Text>
                    {item.location?.district && <Text style={styles.farmerLoc}>📍 {item.location.district}, {item.location.state}</Text>}
                    <Text style={styles.farmerCrops}>{item.crops?.length || 0} crops</Text>
                  </View>
                </View>
              )}
            />
          )}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, padding: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF8E1', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#FFE082' },
  alertCrop: { fontSize: 14, fontWeight: '700', color: colors.text },
  alertDisease: { fontSize: 12, color: '#E65100' },
  alertDate: { fontSize: 11, color: colors.textMuted },
  farmerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  farmerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  farmerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  farmerLoc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  farmerCrops: { fontSize: 11, color: colors.textSecondary },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: borderRadius.lg },
  logoutText: { fontSize: 15, color: colors.error, fontWeight: '700' },
});

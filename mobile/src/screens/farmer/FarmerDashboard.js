import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { userAPI, cropAPI, weatherAPI, diseaseReportAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const QUICK_ACTIONS = [
  { icon: 'scan', label: 'Disease\nDetection', screen: 'DiseaseDetection', color: '#E53935', bg: '#FFEBEE' },
  { icon: 'trending-up', label: 'Market\nPrices', screen: 'Market', color: '#FB8C00', bg: '#FFF3E0' },
  { icon: 'leaf', label: 'My Crops', screen: 'Crops', color: '#43A047', bg: '#E8F5E9' },
  { icon: 'partly-sunny', label: 'Weather', screen: 'Weather', color: '#1E88E5', bg: '#E3F2FD' },
  { icon: 'document-text', label: 'Gov\nSchemes', screen: 'Schemes', color: '#8E24AA', bg: '#F3E5F5' },
  { icon: 'construct', label: 'Equipment', screen: 'Equipment', color: '#00897B', bg: '#E0F2F1' },
  { icon: 'chatbubbles', label: 'AI Chat', screen: 'AIChat', color: '#6BAF6B', bg: '#EAF5EA' },
  { icon: 'git-network', label: 'Supply\nChain', screen: 'SupplyChain', color: '#F4511E', bg: '#FBE9E7' },
];

export default function FarmerDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [diseaseCount, setDiseaseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('Good Morning') : hour < 17 ? t('Good Afternoon') : t('Good Evening');

  const loadData = useCallback(async () => {
    try {
      console.log('[FarmerDashboard] Fetching crops and reports...');
      const [cropsRes, reportsRes] = await Promise.allSettled([
        cropAPI.getCrops(),
        diseaseReportAPI.getReports(),
      ]);
      
      if (cropsRes.status === 'fulfilled') {
        console.log('[FarmerDashboard] Raw crops data:', JSON.stringify(cropsRes.value.data).substring(0, 100));
        const cropsData = cropsRes.value.data;
        console.log('[FarmerDashboard] Crops count:', Array.isArray(cropsData) ? cropsData.length : 'NOT_ARRAY');
        setCrops(Array.isArray(cropsData) ? cropsData : (cropsData?.crops || []));
      } else {
        console.error('[FarmerDashboard] Error loading crops:', cropsRes.reason);
      }
      
      if (reportsRes.status === 'fulfilled') {
        console.log('[FarmerDashboard] Raw reports data:', JSON.stringify(reportsRes.value.data).substring(0, 100));
        const reportsData = reportsRes.value.data;
        const reportsArray = Array.isArray(reportsData) ? reportsData : (reportsData?.diseaseReports || []);
        const active = reportsArray.filter(r => r.reportStatus === 'pending_action');
        console.log('[FarmerDashboard] Active alerts count:', active.length);
        setDiseaseCount(active.length);
      } else {
        console.error('[FarmerDashboard] Error loading reports:', reportsRes.reason);
      }
    } catch (err) {
      console.error('[FarmerDashboard] Unexpected error in loadData:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    Alert.alert(t('Logout'), 'Are you sure you want to logout?', [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Logout'), style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[colors.primary]} />}
      >
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Farmer'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{crops.length}</Text>
              <Text style={styles.statLabel}>Crops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{diseaseCount}</Text>
              <Text style={styles.statLabel}>Active Alerts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{user?.location?.state || 'N/A'}</Text>
              <Text style={styles.statLabel}>State</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.screen}
                style={[styles.actionCard, shadows.sm]}
                onPress={() => navigation.navigate(a.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Crops Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('My Crops')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Crops')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {crops.length === 0 ? (
            <View style={[styles.emptyCard, shadows.sm]}>
              <Ionicons name="leaf-outline" size={36} color={colors.border} />
              <Text style={styles.emptyText}>{t('No crops added yet')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Crops')} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ {t('Add Crop')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {crops.slice(0, 5).map((crop) => (
                <View key={crop._id} style={[styles.cropChip, shadows.sm]}>
                  <Text style={styles.cropEmoji}>🌾</Text>
                  <Text style={styles.cropName}>{crop.cropName}</Text>
                  <Text style={styles.cropArea}>{crop.area} {crop.areaUnit}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Advisory & Disease Alerts */}
        {diseaseCount > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.alertBanner, shadows.sm]}
              onPress={() => navigation.navigate('Crops')}
            >
              <Ionicons name="warning" size={22} color={colors.warning} />
              <Text style={styles.alertText}>
                {diseaseCount} active disease alert{diseaseCount !== 1 ? 's' : ''}. Tap to view.
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.warning} />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.logoutText}>{t('Logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBtn: {},
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md, padding: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  section: { padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: { width: '22%', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 46, height: 46, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  actionLabel: { fontSize: 10, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 14 },
  emptyCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  addBtn: { marginTop: spacing.md, backgroundColor: colors.primaryPale, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.round },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  cropChip: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginRight: spacing.sm, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: colors.border },
  cropEmoji: { fontSize: 24 },
  cropName: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
  cropArea: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF8E1', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: '#FFE082' },
  alertText: { flex: 1, fontSize: 13, color: '#E65100', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 14, color: colors.error, fontWeight: '700' },
});

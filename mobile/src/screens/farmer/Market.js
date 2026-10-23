import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, RefreshControl, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { marketAPI, cropAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

function PriceCard({ item }) {
  const trend = item.previousPrice && item.price !== item.previousPrice;
  const up = item.price > item.previousPrice;
  return (
    <View style={[styles.priceCard, shadows.sm]}>
      <View style={styles.priceCardLeft}>
        <Text style={styles.commodity}>{item.commodity || item.cropName}</Text>
        <Text style={styles.district}>{item.district}, {item.state}</Text>
        <Text style={styles.market}>{item.market}</Text>
      </View>
      <View style={styles.priceCardRight}>
        <Text style={styles.price}>₹{item.price?.toLocaleString()}</Text>
        <Text style={styles.unit}>/{item.unit || 'quintal'}</Text>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: up ? '#E8F5E9' : '#FFEBEE' }]}>
            <Ionicons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? colors.success : colors.error} />
            <Text style={[styles.trendText, { color: up ? colors.success : colors.error }]}>
              {Math.abs(item.price - item.previousPrice).toFixed(0)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function Market({ navigation }) {
  const { t } = useLanguage();
  const [myCropPrices, setMyCropPrices] = useState([]);
  const [prices, setPrices] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('my');

  const fetchData = async () => {
    try {
      const [myRes, filterRes] = await Promise.allSettled([
        marketAPI.getMyCropPrices(),
        marketAPI.getFilters(),
      ]);
      if (myRes.status === 'fulfilled') setMyCropPrices(myRes.value.data.prices || myRes.value.data || []);
      if (filterRes.status === 'fulfilled') setFilters(filterRes.value.data || {});
      // Load general latest prices
      const general = await marketAPI.searchPrices({ limit: 50 });
      const generalData = general.data;
      setPrices(Array.isArray(generalData) ? generalData : (generalData.prices || []));
    } catch (err) {
      console.error('[Market] Fetch Error:', err.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = [
    { label: 'Commodities', val: filters?.commodities?.length || '--', icon: 'basket' },
    { label: 'States', val: filters?.states?.length || '--', icon: 'map' },
    { label: 'Markets', val: prices.length, icon: 'storefront' },
  ];

  if (loading) return <SafeAreaView style={styles.loadWrap}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FB8C00', '#FFA726']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Market Prices')}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statCard, shadows.sm]}>
            <Ionicons name={s.icon} size={20} color="#FB8C00" />
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'my' && styles.tabActive]} onPress={() => setTab('my')}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabActive2]}>My Crops Prices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabActive2]}>All Prices</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tab === 'my' ? myCropPrices : prices}
        keyExtractor={(i, idx) => i._id || String(idx)}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>{tab === 'my' ? 'No prices found for your crops. Add crops first.' : 'No market data available.'}</Text>
          </View>
        }
        renderItem={({ item }) => <PriceCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#FB8C00' },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabActive2: { color: '#FB8C00', fontWeight: '700' },
  priceCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border },
  priceCardLeft: { flex: 1 },
  commodity: { fontSize: 15, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  district: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  market: { fontSize: 11, color: colors.textMuted },
  priceCardRight: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: '#FB8C00' },
  unit: { fontSize: 11, color: colors.textMuted },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.round, marginTop: 4 },
  trendText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

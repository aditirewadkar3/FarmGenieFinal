import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Farmers({ navigation }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const res = await adminAPI.getAllFarmers(); setFarmers(res.data.farmers || []); } catch {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Farmers ({farmers.length})</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} /> : (
        <FlatList
          data={farmers}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No farmers registered.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.avatar}><Ionicons name="leaf" size={22} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>{item.mobileNumber}</Text>
                {item.location?.state && <Text style={styles.detail}>📍 {item.location.district}, {item.location.state}</Text>}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.isApproved ? colors.primaryPale : '#FFF8E1' }]}>
                <Text style={[styles.statusText, { color: item.isApproved ? colors.success : colors.warning }]}>
                  {item.isApproved ? '✓ Active' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --- Agronomists Screen ---
export function Agronomists({ navigation }) {
  const [agronomists, setAgronomists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminAPI.getAllAgronomists().then(r => setAgronomists(r.data.agronomists || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#5C6BC0', '#7986CB']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Agronomists ({agronomists.length})</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color="#5C6BC0" style={{ flex: 1 }} /> : (
        <FlatList data={agronomists} keyExtractor={i => i._id} contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No agronomists registered.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={[styles.avatar, { backgroundColor: '#EDE7F6' }]}><Ionicons name="school" size={22} color="#5C6BC0" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>{item.mobileNumber}</Text>
                {item.agronomistProfile?.specialization && <Text style={styles.detail}>{item.agronomistProfile.specialization}</Text>}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.agronomistProfile?.isVerified ? '#E8F5E9' : '#FFF8E1' }]}>
                <Text style={[styles.statusText, { color: item.agronomistProfile?.isVerified ? colors.success : colors.warning }]}>
                  {item.agronomistProfile?.isVerified ? '✓ Verified' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --- Seeds Screen ---
export function Seeds({ navigation }) {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getAllSeeds().then(r => setSeeds(r.data.seeds || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF9800', '#FFA726']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Seeds ({seeds.length})</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color="#FF9800" style={{ flex: 1 }} /> : (
        <FlatList data={seeds} keyExtractor={i => i._id} contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No seeds in database.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={[styles.avatar, { backgroundColor: '#FFF3E0' }]}><Text style={{ fontSize: 22 }}>🌱</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.crop && <Text style={styles.detail}>Crop: {item.crop}</Text>}
                {item.season && <Text style={styles.detail}>Season: {item.season}</Text>}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --- Fertilizers Screen ---
export function Fertilizers({ navigation }) {
  const [fertilizers, setFertilizers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getAllFertilizers().then(r => setFertilizers(r.data.fertilizers || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#009688', '#26A69A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Fertilizers ({fertilizers.length})</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color="#009688" style={{ flex: 1 }} /> : (
        <FlatList data={fertilizers} keyExtractor={i => i._id} contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No fertilizers in database.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={[styles.avatar, { backgroundColor: '#E0F2F1' }]}><Text style={{ fontSize: 22 }}>🧪</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.type && <Text style={styles.detail}>Type: {item.type}</Text>}
                {item.nutrients && <Text style={styles.detail}>{item.nutrients}</Text>}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --- Facilities Screen ---
export function Facilities({ navigation }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getAllFacilities().then(r => setFacilities(r.data.facilities || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F44336', '#EF5350']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Facilities ({facilities.length})</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color="#F44336" style={{ flex: 1 }} /> : (
        <FlatList data={facilities} keyExtractor={i => i._id} contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No facilities in database.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={[styles.avatar, { backgroundColor: '#FFEBEE' }]}><Ionicons name="business" size={22} color="#F44336" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.type && <Text style={styles.detail}>Type: {item.type}</Text>}
                {item.location?.district && <Text style={styles.detail}>📍 {item.location.district}, {item.location.state}</Text>}
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
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  detail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.round },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted },
});

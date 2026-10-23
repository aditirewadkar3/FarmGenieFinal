import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplyChainAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function SupplyChain({ navigation }) {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [collab, setCollab] = useState({ stats: null, connected: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ cropName: '', quantity: '', unit: 'quintal', pricePerUnit: '', description: '' });

  const load = async () => {
    try {
      const [near, mine, stats] = await Promise.allSettled([
        supplyChainAPI.getNearbyListings(null, null, 50),
        supplyChainAPI.getConnectedListings(),
        supplyChainAPI.getMyCollaborations(),
      ]);
      if (near.status === 'fulfilled') setListings(near.value.data.listings || []);
      setCollab({
        stats: stats.status === 'fulfilled' ? stats.value.data : null,
        connected: mine.status === 'fulfilled' ? mine.value.data.listings || [] : [],
      });
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const createListing = async () => {
    if (!form.cropName || !form.quantity || !form.pricePerUnit) { Alert.alert('Missing', 'Fill all required fields.'); return; }
    setSaving(true);
    try {
      await supplyChainAPI.createListing(form);
      setShowAdd(false);
      setForm({ cropName: '', quantity: '', unit: 'quintal', pricePerUnit: '', description: '' });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create listing.');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F4511E', '#FF7043']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Supply Chain</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      {collab.stats && (
        <View style={styles.statsRow}>
          {[
            { label: 'Total Requests', val: collab.stats.total || 0 },
            { label: 'Accepted', val: collab.stats.accepted || 0 },
            { label: 'Connected', val: collab.connected.length },
          ].map(s => (
            <View key={s.label} style={[styles.stat, shadows.sm]}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {loading ? <View style={styles.loadWrap}><ActivityIndicator size="large" color="#F4511E" /></View> : (
        <FlatList
          data={listings}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#F4511E']} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No nearby listings. Create one to get started!</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.listCard, shadows.sm]}>
              <View style={styles.listHeader}>
                <Text style={styles.listCrop}>{item.cropName}</Text>
                <Text style={styles.listPrice}>₹{item.pricePerUnit}/{item.unit}</Text>
              </View>
              <Text style={styles.listQty}>{item.quantity} {item.unit} available</Text>
              {item.description ? <Text style={styles.listDesc}>{item.description}</Text> : null}
              {item.farmer?.name && <Text style={styles.listFarmer}>👤 {item.farmer.name}</Text>}
              <TouchableOpacity
                style={styles.reqBtn}
                onPress={() => supplyChainAPI.sendRequest({ listingId: item._id }).then(() => Alert.alert('✅ Request Sent!', 'The farmer will be notified.')).catch(() => {})}
              >
                <Text style={styles.reqBtnText}>Send Collaboration Request</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}><Text style={styles.modalTitle}>Create Listing</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            {[
              { key: 'cropName', label: 'Crop Name *', placeholder: 'e.g. Tomato, Onion, Rice' },
              { key: 'quantity', label: 'Quantity *', placeholder: '100', keyboard: 'numeric' },
              { key: 'pricePerUnit', label: 'Price per Unit (₹) *', placeholder: 'e.g. 1500', keyboard: 'numeric' },
              { key: 'description', label: 'Description', placeholder: 'Quality, availability details...' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={colors.textMuted}
                  value={form[f.key]} onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))} keyboardType={f.keyboard} />
              </View>
            ))}
            <Text style={styles.label}>Unit</Text>
            <View style={styles.chipRow}>
              {['quintal', 'kg', 'ton', 'dozen'].map(u => (
                <TouchableOpacity key={u} style={[styles.chip, form.unit === u && styles.chipActive]} onPress={() => setForm(x => ({ ...x, unit: u }))}>
                  <Text style={[styles.chipText, form.unit === u && styles.chipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={createListing} disabled={saving}>
              <LinearGradient colors={['#F4511E', '#FF7043']} style={styles.submitGrad}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Listing</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 20, fontWeight: '800', color: '#F4511E' },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  listCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  listCrop: { fontSize: 16, fontWeight: '700', color: colors.text },
  listPrice: { fontSize: 15, fontWeight: '800', color: '#F4511E' },
  listQty: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  listDesc: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  listFarmer: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  reqBtn: { backgroundColor: '#FBE9E7', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  reqBtnText: { fontSize: 13, fontWeight: '700', color: '#F4511E' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: colors.text, backgroundColor: colors.background, height: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { borderColor: '#F4511E', backgroundColor: '#FBE9E7' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#F4511E', fontWeight: '700' },
  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitGrad: { padding: spacing.md, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

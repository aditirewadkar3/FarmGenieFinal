import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { equipmentAPI, expertChatAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const EQUIP_TYPES = ['', 'Tractor', 'Harvester', 'Irrigation', 'Plough', 'Sprayer'];
const EQUIP_ICONS = { Tractor: '🚜', Harvester: '🌾', Irrigation: '💧', Plough: '⚙️', Sprayer: '🌿', '': '🔧' };

export default function EquipmentMarketplace({ navigation }) {
  const { t } = useLanguage();
  const [equipment, setEquipment] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('nearby');
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Tractor', pricePerDay: '', condition: 'Good', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchNearby = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const res = await equipmentAPI.getNearby(50, filterType);
      setEquipment(res.data.equipment || []);
    } catch {}
  };

  const fetchMine = async () => {
    try {
      const res = await equipmentAPI.getMyListings();
      setMyListings(res.data.equipment || []);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchNearby(), fetchMine()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [filterType]);

  const addListing = async () => {
    if (!form.name || !form.pricePerDay) { Alert.alert('Missing', 'Name and price are required.'); return; }
    setSaving(true);
    try {
      await equipmentAPI.create(form);
      setShowAddModal(false);
      fetchMine();
      setTab('mine');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add listing.');
    }
    setSaving(false);
  };

  const initChat = async (ownerId, ownerName) => {
    try {
      const res = await expertChatAPI.initChat(ownerId, 'equipment');
      navigation.navigate('Messages', { chatId: res.data.chatId, otherUser: ownerName });
    } catch {
      Alert.alert('Error', 'Could not start chat. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#00897B', '#26A69A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Rental</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['nearby', 'mine'].map(tb => (
          <TouchableOpacity key={tb} style={[styles.tab, tab === tb && styles.tabActive]} onPress={() => setTab(tb)}>
            <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>{tb === 'nearby' ? '📍 Nearby' : '📋 My Listings'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filter (nearby only) */}
      {tab === 'nearby' && (
        <View style={{ maxHeight: 48 }}>
          <FlatList
            horizontal
            data={EQUIP_TYPES}
            keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.typeChip, filterType === item && styles.typeChipActive]}
                onPress={() => setFilterType(item)}
              >
                <Text style={[styles.typeChipText, filterType === item && styles.typeChipTextActive]}>
                  {EQUIP_ICONS[item]} {item || 'All'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadWrap}><ActivityIndicator size="large" color="#00897B" /></View>
      ) : (
        <FlatList
          data={tab === 'nearby' ? equipment : myListings}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#00897B']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>{EQUIP_ICONS[filterType] || '🔧'}</Text>
              <Text style={styles.emptyText}>{tab === 'nearby' ? 'No equipment found nearby.' : 'You have no listings yet.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardHeader}>
                <View style={styles.equip_icon}>
                  <Text style={{ fontSize: 28 }}>{EQUIP_ICONS[item.type] || '🔧'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.equipName}>{item.name}</Text>
                  <Text style={styles.equipType}>{item.type} · {item.condition}</Text>
                </View>
                <Text style={styles.equipPrice}>₹{item.pricePerDay}/day</Text>
              </View>
              {item.description ? <Text style={styles.equipDesc}>{item.description}</Text> : null}
              <View style={styles.cardMeta}>
                {item.owner?.name && <Text style={styles.metaText}>👤 {item.owner.name}</Text>}
                {item.distance != null && <Text style={styles.metaText}>📍 {item.distance.toFixed(1)} km</Text>}
              </View>
              {tab === 'nearby' && item.owner?._id && (
                <TouchableOpacity style={styles.chatBtn} onPress={() => initChat(item.owner._id, item.owner.name)}>
                  <Ionicons name="chatbubble" size={16} color={colors.primary} />
                  <Text style={styles.chatBtnText}>Chat with Owner</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Add Listing Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add Equipment Listing</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {[
              { key: 'name', label: 'Equipment Name *', placeholder: 'e.g. Mahindra 575 DI Tractor' },
              { key: 'pricePerDay', label: 'Price per Day (₹) *', placeholder: '500', keyboard: 'numeric' },
              { key: 'description', label: 'Description', placeholder: 'Condition, availability, etc.' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={form[f.key]}
                  onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))}
                  keyboardType={f.keyboard}
                />
              </View>
            ))}
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {['Tractor', 'Harvester', 'Irrigation', 'Plough', 'Sprayer', 'Other'].map(tp => (
                <TouchableOpacity key={tp} style={[styles.chip, form.type === tp && styles.chipActive]} onPress={() => setForm(x => ({ ...x, type: tp }))}>
                  <Text style={[styles.chipText, form.type === tp && styles.chipTextActive]}>{tp}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={addListing} disabled={saving}>
              <LinearGradient colors={['#00897B', '#26A69A']} style={styles.submitGrad}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>List Equipment</Text>}
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
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#00897B' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#00897B', fontWeight: '700' },
  typeChip: { paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, marginRight: 6, backgroundColor: colors.card },
  typeChipActive: { borderColor: '#00897B', backgroundColor: '#E0F2F1' },
  typeChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  typeChipTextActive: { color: '#00897B', fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  equip_icon: { width: 50, height: 50, backgroundColor: '#E0F2F1', borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  equipName: { fontSize: 15, fontWeight: '700', color: colors.text },
  equipType: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  equipPrice: { fontSize: 16, fontWeight: '800', color: '#00897B' },
  equipDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  cardMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryPale, padding: spacing.sm, borderRadius: borderRadius.md, justifyContent: 'center' },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: colors.text, backgroundColor: colors.background, height: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { borderColor: '#00897B', backgroundColor: '#E0F2F1' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#00897B', fontWeight: '700' },
  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitGrad: { padding: spacing.md, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

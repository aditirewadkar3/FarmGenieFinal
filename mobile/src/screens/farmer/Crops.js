import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cropAPI, diseaseReportAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const SEASON_OPTIONS = ['Kharif', 'Rabi', 'Zaid', 'Perennial'];
const AREA_UNITS = ['acres', 'hectares', 'bigha', 'guntha'];

export default function Crops({ navigation }) {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [diseaseReports, setDiseaseReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ cropName: '', variety: '', area: '', areaUnit: 'acres', season: 'Kharif', sowingDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      console.log('[Crops] Fetching crops and reports...');
      const [c, d] = await Promise.all([cropAPI.getCrops(), diseaseReportAPI.getReports()]);
      console.log('[Crops] Raw Crops:', JSON.stringify(c.data).substring(0, 100));
      console.log('[Crops] Raw Reports:', JSON.stringify(d.data).substring(0, 100));
      setCrops(Array.isArray(c.data) ? c.data : (c.data?.crops || []));
      setDiseaseReports(Array.isArray(d.data) ? d.data : (d.data?.diseaseReports || []));
    } catch (err) {
      console.error('[Crops] Error fetching data:', err.message);
    }
    setLoading(false);
  };

  const addCrop = async () => {
    if (!form.cropName || !form.area) { Alert.alert('Missing Fields', 'Crop name and area are required.'); return; }
    setSaving(true);
    try {
      await cropAPI.addCrop(form);
      setShowModal(false);
      setForm({ cropName: '', variety: '', area: '', areaUnit: 'acres', season: 'Kharif', sowingDate: '' });
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add crop.');
    }
    setSaving(false);
  };

  const deleteCrop = (id, name) => {
    Alert.alert('Delete Crop', `Remove ${name} from your farm?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await cropAPI.deleteCrop(id); fetchAll(); } catch {}
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={styles.loadWrap}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('My Crops')}</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addHeaderBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={crops}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>{t('No crops added yet')}</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>+ {t('Add Crop')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: crop }) => {
          const reports = diseaseReports.filter(r => r.crop === crop._id || r.cropName === crop.cropName);
          const activeAlerts = reports.filter(r => !r.treated).length;
          return (
            <View style={[styles.cropCard, shadows.sm]}>
              <View style={styles.cropCardHeader}>
                <View style={styles.cropIcon}>
                  <Text style={{ fontSize: 24 }}>🌾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>{crop.cropName}</Text>
                  {crop.variety ? <Text style={styles.cropVariety}>{crop.variety}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => deleteCrop(crop._id, crop.cropName)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.cropMeta}>
                <View style={styles.metaChip}>
                  <Ionicons name="resize" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{crop.area} {crop.areaUnit}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="calendar" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{crop.season}</Text>
                </View>
                {activeAlerts > 0 && (
                  <View style={[styles.metaChip, styles.alertChip]}>
                    <Ionicons name="warning" size={12} color={colors.warning} />
                    <Text style={[styles.metaText, { color: colors.warning }]}>{activeAlerts} Alert{activeAlerts > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add Crop Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Add Crop')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {[
              { key: 'cropName', label: 'Crop Name *', placeholder: 'e.g. Rice, Wheat, Cotton' },
              { key: 'variety', label: 'Variety', placeholder: 'e.g. IR64, HD2967' },
              { key: 'area', label: 'Area *', placeholder: 'e.g. 2.5', keyboard: 'numeric' },
            ].map(({ key, label, placeholder, keyboard }) => (
              <View key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  keyboardType={keyboard}
                />
              </View>
            ))}

            <Text style={styles.label}>Season</Text>
            <View style={styles.chipRow}>
              {SEASON_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.season === s && styles.chipActive]} onPress={() => setForm(f => ({ ...f, season: s }))}>
                  <Text style={[styles.chipText, form.season === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Area Unit</Text>
            <View style={styles.chipRow}>
              {AREA_UNITS.map(u => (
                <TouchableOpacity key={u} style={[styles.chip, form.areaUnit === u && styles.chipActive]} onPress={() => setForm(f => ({ ...f, areaUnit: u }))}>
                  <Text style={[styles.chipText, form.areaUnit === u && styles.chipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={addCrop} disabled={saving}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.submitGrad}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Crop</Text>}
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
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  addHeaderBtn: {},
  cropCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  cropCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cropIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  cropName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cropVariety: { fontSize: 12, color: colors.textMuted },
  deleteBtn: { padding: spacing.sm },
  cropMeta: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.sectionHighlight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.round },
  alertChip: { backgroundColor: '#FFF8E1', borderColor: '#FFE082', borderWidth: 1 },
  metaText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  emptyBtn: { marginTop: spacing.md, backgroundColor: colors.primaryPale, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.round },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: colors.text, backgroundColor: colors.background, height: 44 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark, fontWeight: '700' },
  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitGrad: { padding: spacing.md, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

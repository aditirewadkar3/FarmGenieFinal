import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, SafeAreaView, Alert, TextInput, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { diseaseReportAPI, geminiAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const CROPS = ['Tomato', 'Potato', 'Wheat', 'Rice', 'Corn/Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Pepper', 'Grapes', 'Mango'];

export default function DiseaseDetection({ navigation }) {
  const { t, language } = useLanguage();
  const [image, setImage] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [aiInfo, setAiInfo] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('detect'); // 'detect' | 'history'

  const pickImage = async (fromCamera = false) => {
    let permResult;
    if (fromCamera) {
      permResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    if (permResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant the required permissions in settings.'); return;
    }
    const opt = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opt)
      : await ImagePicker.launchImageLibraryAsync(opt);
    if (!res.canceled) {
      setImage(res.assets[0]);
      setResult(null);
      setAiInfo(null);
    }
  };

  const runDetection = async () => {
    if (!image) { Alert.alert('No Image', 'Please select or take a photo first.'); return; }
    setDetecting(true);
    setResult(null);
    setAiInfo(null);
    try {
      const res = await diseaseReportAPI.detectDisease(selectedCrop, image);
      const data = res.data;
      setResult(data);
      // Fetch AI info if disease detected
      if (data.disease_name && data.disease_name !== 'healthy') {
        setLoadingAi(true);
        geminiAPI.getCropDiseaseInfo(data.crop_name || selectedCrop, data.disease_name, language)
          .then(r => setAiInfo(r.data))
          .catch(() => {})
          .finally(() => setLoadingAi(false));
      }
    } catch (err) {
      Alert.alert('Detection Failed', err.response?.data?.message || 'Could not process the image. Please try again.');
    }
    setDetecting(false);
  };

  const getConfidenceColor = (c) => c >= 80 ? colors.success : c >= 50 ? colors.warning : colors.error;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#E53935', '#EF9A9A']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Disease')}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[{ id: 'detect', label: '🔍 Detect' }, { id: 'history', label: '📋 History' }].map(tb => (
          <TouchableOpacity key={tb.id} style={[styles.tab, tab === tb.id && styles.tabActive]} onPress={() => {
            setTab(tb.id);
            if (tb.id === 'history') diseaseReportAPI.getReports().then(r => setReports(r.data.diseaseReports || [])).catch(() => {});
          }}>
            <Text style={[styles.tabText, tab === tb.id && styles.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'detect' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
          {/* Crop Selector */}
          <Text style={styles.label}>Select Crop (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {CROPS.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, selectedCrop === c && styles.chipActive]} onPress={() => setSelectedCrop(selectedCrop === c ? '' : c)}>
                <Text style={[styles.chipText, selectedCrop === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Image picker */}
          <View style={[styles.imageBox, shadows.sm]}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.selectedImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.border} />
                <Text style={styles.imagePlaceholderText}>No image selected</Text>
              </View>
            )}
          </View>

          <View style={styles.imageActions}>
            <TouchableOpacity style={[styles.imgBtn, shadows.sm]} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={styles.imgBtnText}>{t('Take Photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.imgBtn, shadows.sm]} onPress={() => pickImage(false)}>
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={styles.imgBtnText}>{t('Upload Image')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.detectBtn, !image && styles.detectBtnDisabled]} onPress={runDetection} disabled={!image || detecting}>
            <LinearGradient colors={['#E53935', '#EF5350']} style={styles.detectGrad}>
              {detecting ? <ActivityIndicator color="#fff" /> : <>
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.detectText}>{t('Detect Disease')}</Text>
              </>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Result */}
          {result && (
            <View style={[styles.resultCard, shadows.md]}>
              <Text style={styles.resultTitle}>{t('Detection Result')}</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Disease:</Text>
                <Text style={[styles.resultVal, { color: result.disease_name === 'healthy' ? colors.success : colors.error }]}>
                  {result.disease_name?.replace(/_/g, ' ') || 'Unknown'}
                </Text>
              </View>
              {result.confidence != null && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Confidence:</Text>
                  <Text style={[styles.resultVal, { color: getConfidenceColor(result.confidence) }]}>
                    {result.confidence.toFixed(1)}%
                  </Text>
                </View>
              )}
              {result.crop_name && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Crop:</Text>
                  <Text style={styles.resultVal}>{result.crop_name}</Text>
                </View>
              )}

              {loadingAi && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />}
              {aiInfo && (
                <View style={styles.aiSection}>
                  <Text style={styles.aiTitle}>🤖 AI Treatment Advice</Text>
                  <Text style={styles.aiText}>{aiInfo.treatment || aiInfo.info || JSON.stringify(aiInfo).slice(0, 500)}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No disease reports yet.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.reportCard, shadows.sm]}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportCrop}>{item.cropName || 'Unknown Crop'}</Text>
                <View style={[styles.reportStatus, { backgroundColor: item.treated ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.reportStatusText, { color: item.treated ? colors.success : colors.error }]}>
                    {item.treated ? '✓ Treated' : '⚠ Active'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportDisease}>{item.diseaseName || 'Disease Detected'}</Text>
              <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              {!item.treated && (
                <TouchableOpacity style={styles.markTreatedBtn} onPress={() => {
                  diseaseReportAPI.markTreated(item._id).then(() => {
                    setReports(r => r.map(x => x._id === item._id ? { ...x, treated: true } : x));
                  });
                }}>
                  <Text style={styles.markTreatedText}>Mark as Treated</Text>
                </TouchableOpacity>
              )}
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
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, padding: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#E53935' },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#E53935', fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, marginRight: spacing.sm },
  chipActive: { borderColor: '#E53935', backgroundColor: '#FFEBEE' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#E53935', fontWeight: '700' },
  imageBox: { borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.card, marginBottom: spacing.md, height: 200 },
  selectedImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: colors.textMuted, marginTop: spacing.sm },
  imageActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  imgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  imgBtnText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  detectBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing.md },
  detectBtnDisabled: { opacity: 0.5 },
  detectGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  detectText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  resultCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  resultTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  resultLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  resultVal: { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  aiSection: { backgroundColor: colors.sectionHighlight, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  aiTitle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.sm },
  aiText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  reportCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportCrop: { fontSize: 15, fontWeight: '700', color: colors.text },
  reportStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.round },
  reportStatusText: { fontSize: 11, fontWeight: '700' },
  reportDisease: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  reportDate: { fontSize: 11, color: colors.textMuted },
  markTreatedBtn: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.primaryPale, borderRadius: borderRadius.md, alignItems: 'center' },
  markTreatedText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted },
});

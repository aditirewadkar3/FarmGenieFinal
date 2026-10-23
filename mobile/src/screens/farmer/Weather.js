import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { weatherAPI, geminiAPI, cropAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const WX_ICONS = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 51: '🌦', 61: '🌧', 71: '🌨', 80: '🌦', 95: '⛈' };

function getIcon(code) {
  if (!code) return '🌤';
  const c = parseInt(code);
  for (const k of Object.keys(WX_ICONS).map(Number).sort((a,b)=>b-a)) {
    if (c >= k) return WX_ICONS[k];
  }
  return '🌤';
}

export default function Weather({ navigation }) {
  const { t, language } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchWeather = async () => {
    try {
      const res = await weatherAPI.getWeather();
      setWeather(res.data);
      fetchAiInsight(res.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAiInsight = async (w) => {
    if (!w) return;
    setLoadingAi(true);
    try {
      const cropsRes = await cropAPI.getCrops();
      const cropsData = cropsRes.data;
      const cropsArray = Array.isArray(cropsData) ? cropsData : (cropsData?.crops || []);
      const cropName = cropsArray[0]?.cropName || 'general crops';
      
      const res = await geminiAPI.getWeatherCropImpact(cropName, w.current, w.daily, language);
      const resData = res.data;
      setAiInsight(resData?.insight || resData?.advice || resData?.analysis || (typeof resData === 'string' ? resData : 'No specific advice available at this time.'));
    } catch (err) {
      console.error('[Weather] AI Insight Error:', err.message);
    }
    setLoadingAi(false);
  };

  useEffect(() => { fetchWeather(); }, []);

  if (loading) return <SafeAreaView style={styles.loadWrap}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;

  const current = weather?.current || {};
  const daily = weather?.daily;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWeather(); }} colors={[colors.primary]} />}>
        {/* Header */}
        <LinearGradient colors={['#1E88E5', '#42A5F5']} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('Weather')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Current weather */}
          <View style={styles.currentWrap}>
            <Text style={styles.weatherIcon}>{getIcon(current.weatherCode)}</Text>
            <Text style={styles.tempLarge}>{current.temperature ?? '--'}°C</Text>
            <Text style={styles.feelsLike}>Feels like {current.apparentTemperature ?? '--'}°C</Text>
          </View>

          <View style={styles.currentMeta}>
            {[
              { icon: 'water', val: `${current.relativeHumidity ?? '--'}%`, label: 'Humidity' },
              { icon: 'speedometer', val: `${current.windSpeed ?? '--'} km/h`, label: 'Wind' },
              { icon: 'rainy', val: `${current.precipitation ?? '--'} mm`, label: 'Rain' },
            ].map(m => (
              <View key={m.label} style={styles.metaBlock}>
                <Ionicons name={m.icon} size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaVal}>{m.val}</Text>
                <Text style={styles.metaLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 7-day Forecast */}
        {daily && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Forecast</Text>
            {(daily.time || []).slice(0, 7).map((day, i) => (
              <View key={day} style={[styles.dayRow, shadows.sm]}>
                <Text style={styles.dayName}>{new Date(day).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                <Text style={styles.dayIcon}>{getIcon(daily.weatherCode?.[i])}</Text>
                <Text style={styles.dayRain}>
                  <Ionicons name="rainy" size={12} color="#1E88E5" /> {(daily.precipitationSum?.[i] || 0).toFixed(1)} mm
                </Text>
                <View style={styles.dayTemps}>
                  <Text style={styles.dayMax}>{Math.round(daily.temperature2mMax?.[i] ?? 0)}°</Text>
                  <Text style={styles.dayMin}>{Math.round(daily.temperature2mMin?.[i] ?? 0)}°</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AI Crop Insight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Crop Insight</Text>
          {loadingAi ? (
            <View style={[styles.aiCard, shadows.sm]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiLoadText}>Analyzing weather impact on your crops...</Text>
            </View>
          ) : aiInsight ? (
            <View style={[styles.aiCard, shadows.sm]}>
              <Text style={styles.aiText}>{aiInsight}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  currentWrap: { alignItems: 'center', paddingBottom: spacing.md },
  weatherIcon: { fontSize: 64 },
  tempLarge: { fontSize: 56, fontWeight: '800', color: '#fff', lineHeight: 64 },
  feelsLike: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  currentMeta: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  metaBlock: { alignItems: 'center' },
  metaVal: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  metaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  section: { padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  dayName: { flex: 1.5, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  dayIcon: { fontSize: 22, marginHorizontal: spacing.sm },
  dayRain: { flex: 1, fontSize: 11, color: '#1E88E5', fontWeight: '600' },
  dayTemps: { flexDirection: 'row', gap: spacing.sm },
  dayMax: { fontSize: 15, fontWeight: '800', color: colors.text },
  dayMin: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  aiCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: spacing.sm },
  aiLoadText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  aiText: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Login({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert('Missing Fields', 'Please enter your mobile number and password.');
      return;
    }
    setLoading(true);
    const result = await login(mobile, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.primaryPale, colors.background]} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.logoCircle}>
              <Ionicons name="leaf" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>KrishiBandhu</Text>
            <Text style={styles.tagline}>Crop Shield for India's Farmers</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, shadows.md]}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('Sign In')}</Text>
              <Text style={styles.cardSubtitle}>Welcome back! Please sign in to continue.</Text>
            </LinearGradient>

            <View style={styles.form}>
              {/* Mobile */}
              <Text style={styles.label}>{t('Mobile Number')}</Text>
              <View style={styles.inputRow}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                  maxLength={10}
                />
              </View>

              {/* Password */}
              <Text style={styles.label}>{t('Password')}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.submitGrad}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <><Text style={styles.submitText}>{t('Sign In')}</Text>
                       <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} /></>
                  }
                </LinearGradient>
              </TouchableOpacity>

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>{t('Sign Up')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Trust badges */}
          <View style={styles.badges}>
            {[
              { icon: 'shield-checkmark', label: 'Secure Login' },
              { icon: 'leaf', label: 'For Farmers' },
              { icon: 'flag', label: 'Made in India' },
            ].map((b, i) => (
              <View key={i} style={[styles.badge, shadows.sm]}>
                <Ionicons name={b.icon} size={22} color={colors.primary} />
                <Text style={styles.badgeText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
  logoWrap: { alignItems: 'center', marginBottom: spacing.lg },
  logoCircle: { width: 80, height: 80, borderRadius: borderRadius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  appName: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  tagline: { fontSize: 13, color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.xl, overflow: 'hidden', marginBottom: spacing.lg },
  cardHeader: { padding: spacing.lg, alignItems: 'center' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  form: { padding: spacing.lg },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.background },
  prefix: { fontSize: 14, fontWeight: '600', color: colors.textMuted, paddingRight: spacing.sm },
  input: { flex: 1, padding: spacing.sm, fontSize: 15, color: colors.text, height: 48 },
  eyeBtn: { padding: spacing.sm },
  submitBtn: { marginTop: spacing.md, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  registerText: { fontSize: 13, color: colors.textMuted },
  registerLink: { fontSize: 13, fontWeight: '800', color: colors.primary },
  badges: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  badge: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.text, marginTop: 4, textAlign: 'center' },
});

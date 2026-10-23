import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const ROLES = [
  { value: 'farmer', label: 'Farmer 🌾', icon: 'leaf' },
  { value: 'retailer', label: 'Retailer 🏪', icon: 'storefront' },
  { value: 'agronomist', label: 'Agronomist 🔬', icon: 'school' },
];

export default function Register({ navigation }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [idProof, setIdProof] = useState(null);
  const [form, setForm] = useState({
    name: '', mobileNumber: '', password: '', confirmPassword: '', role: 'farmer',
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickId = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setIdProof(res.assets[0]);
  };

  const handleRegister = async () => {
    if (!form.name || !form.mobileNumber || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.'); return;
    }
    if (form.mobileNumber.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.'); return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        mobileNumber: form.mobileNumber,
        password: form.password,
        role: form.role,
      }, idProof);
      Alert.alert('Registration Successful!', 'Your account is pending admin approval. You can login once approved.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={[colors.primaryPale, colors.background]} style={styles.bg}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
        </View>

        <View style={[styles.card, shadows.md]}>
          {/* Role Selection */}
          <Text style={styles.section}>Select Your Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleChip, form.role === r.value && styles.roleChipActive]}
                onPress={() => update('role', r.value)}
              >
                <Text style={[styles.roleChipText, form.role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          {[
            { key: 'name', label: 'Full Name', placeholder: 'Enter your full name', keyboardType: 'default' },
            { key: 'mobileNumber', label: 'Mobile Number', placeholder: '10-digit mobile', keyboardType: 'phone-pad', maxLength: 10 },
            { key: 'password', label: 'Password', placeholder: 'Create a password', secure: true },
            { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter password', secure: true },
          ].map(({ key, label, placeholder, keyboardType, secure, maxLength }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={keyboardType}
                secureTextEntry={secure}
                value={form[key]}
                onChangeText={(v) => update(key, v)}
                maxLength={maxLength}
              />
            </View>
          ))}

          {/* ID Proof */}
          <Text style={styles.label}>ID Proof (optional)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickId}>
            <Ionicons name={idProof ? 'checkmark-circle' : 'cloud-upload'} size={20} color={idProof ? colors.success : colors.textMuted} />
            <Text style={[styles.uploadText, idProof && { color: colors.success }]}>
              {idProof ? 'ID Document Selected ✓' : 'Upload ID Proof'}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.submitGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Create Account</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  bg: { flex: 1, padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingTop: Platform.OS === 'ios' ? 50 : spacing.md },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginLeft: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg },
  section: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  roleChip: { paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  roleChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  roleChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  roleChipTextActive: { color: colors.primaryDark, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text, backgroundColor: colors.background, height: 48 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: colors.background, borderStyle: 'dashed' },
  uploadText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  submitBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitGrad: { padding: spacing.md, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  loginLink: { alignItems: 'center', marginTop: spacing.md },
  loginLinkText: { fontSize: 13, color: colors.textMuted },
  loginLinkBold: { fontWeight: '800', color: colors.primary },
});

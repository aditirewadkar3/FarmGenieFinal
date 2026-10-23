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

export default function Register({ navigation }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [idProof, setIdProof] = useState(null);
  const [form, setForm] = useState({
    name: '', mobileNumber: '', password: '', confirmPassword: '',
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
        role: 'farmer',
      }, idProof);
      Alert.alert('Registration Successful!', 'Your account has been created. You can now login.', [
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

          {/* ID Proof (optional) */}
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
  bg: { flex: 1, padding: spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, fontSize: 14, color: colors.textPrimary,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1,
    borderColor: colors.border, borderStyle: 'dashed', borderRadius: borderRadius.md,
    padding: spacing.md, justifyContent: 'center', marginTop: 4, backgroundColor: colors.background,
  },
  uploadText: { fontSize: 13, color: colors.textMuted },
  submitBtn: { marginTop: spacing.xl, borderRadius: borderRadius.lg, overflow: 'hidden' },
  submitGrad: { paddingVertical: spacing.md, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { marginTop: spacing.lg, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: colors.textSecondary },
  loginLinkBold: { color: colors.primary, fontWeight: '700' },
});

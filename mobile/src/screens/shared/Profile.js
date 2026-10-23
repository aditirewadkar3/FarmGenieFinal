import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, SafeAreaView, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function Profile({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const { t, language, changeLanguage, languages } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Profile] Fetching user profile data...');
    userAPI.getProfile().then(r => {
      console.log('[Profile] Raw profile response:', JSON.stringify(r.data).substring(0, 100));
      const userData = r.data.user || r.data;
      console.log('[Profile] Success fetching profile:', userData?.fullName || userData?.name);
      setProfile(userData);
      setForm({
        name: userData?.fullName || userData?.name || '',
        email: userData?.email || '',
        phone: userData?.mobileNumber || userData?.phone || ''
      });
    }).catch((err) => {
      console.error('[Profile] Error fetching profile:', err.response?.data || err.message);
      setProfile(user);
      setForm({ name: user?.fullName || user?.name || '', email: user?.email || '' });
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data.user || form);
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  const changePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) {
      try {
        const r = await userAPI.uploadPhoto(res.assets[0]);
        updateUser({ photo: r.data.photo });
      } catch (e) {
        Alert.alert('Error', 'Could not update photo.');
      }
    }
  };

  if (loading) return <SafeAreaView style={styles.loadWrap}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaView>;

  const displayUser = profile || user;
  const ROLE_COLORS = { farmer: colors.primary, retailer: '#FB8C00', agronomist: '#5C6BC0', admin: '#E53935' };
  const roleColor = ROLE_COLORS[displayUser?.role] || colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Hero */}
        <LinearGradient colors={[roleColor, `${roleColor}99`]} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={changePhoto} style={styles.avatarWrap}>
            {displayUser?.photo ? (
              <Image source={{ uri: displayUser.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={roleColor} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>{displayUser?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{displayUser?.role?.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Info Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <TouchableOpacity onPress={() => editing ? save() : setEditing(true)} style={[styles.editBtn, { backgroundColor: roleColor }]}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Ionicons name={editing ? 'checkmark' : 'pencil'} size={14} color="#fff" />
                  <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text></>
              )}
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={[styles.card, shadows.sm]}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Your name' },
                { key: 'email', label: 'Email', placeholder: 'your@email.com', keyboard: 'email-address' },
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
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, shadows.sm]}>
              {[
                { icon: 'person', label: 'Name', val: displayUser?.name },
                { icon: 'phone-portrait', label: 'Mobile', val: displayUser?.mobileNumber },
                { icon: 'mail', label: 'Email', val: displayUser?.email || 'Not set' },
                { icon: 'location', label: 'Location', val: displayUser?.location ? `${displayUser.location.district || ''}, ${displayUser.location.state || ''}`.trim().replace(/^,\s*/, '') : 'Not set' },
              ].map(f => (
                <View key={f.label} style={styles.infoRow}>
                  <View style={styles.infoIcon}><Ionicons name={f.icon} size={16} color={roleColor} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{f.label}</Text>
                    <Text style={styles.infoVal}>{f.val || 'Not set'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.langRow}>
              {Object.values(languages).map(l => (
                <TouchableOpacity key={l.code} style={[styles.langChip, language === l.code && { borderColor: roleColor, backgroundColor: `${roleColor}15` }]} onPress={() => changeLanguage(l.code)}>
                  <Text style={[styles.langChipText, language === l.code && { color: roleColor, fontWeight: '700' }]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xl },
  backBtn: { position: 'absolute', top: spacing.xl, left: spacing.md },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: spacing.sm },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.round },
  roleText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  section: { padding: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.round },
  editBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sectionHighlight, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  infoVal: { fontSize: 14, color: colors.text, fontWeight: '600', marginTop: 1 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: colors.text, backgroundColor: colors.background, height: 44 },
  cancelBtn: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  cancelBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  langChipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { fontSize: 15, color: colors.error, fontWeight: '700' },
});

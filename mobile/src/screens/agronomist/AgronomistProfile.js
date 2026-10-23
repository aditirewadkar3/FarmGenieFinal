import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { agronomistAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function AgronomistProfile({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agronomistAPI.getProfile().then(r => {
      setProfile(r.data.agronomist);
      setForm({ qualification: r.data.agronomist?.qualification || '', specialization: r.data.agronomist?.specialization || '', experience: String(r.data.agronomist?.experience || ''), bio: r.data.agronomist?.bio || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await agronomistAPI.updateProfile(form);
      setProfile(res.data.agronomist || { ...profile, ...form });
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed.');
    }
    setSaving(false);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#5C6BC0" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <LinearGradient colors={['#5C6BC0', '#7986CB']} style={styles.hero}>
          <View style={styles.heroAvatar}><Ionicons name="school" size={40} color="#5C6BC0" /></View>
          <Text style={styles.heroName}>{user?.name}</Text>
          <View style={[styles.badge, { backgroundColor: profile?.isVerified ? '#4CAF5033' : '#FF980033' }]}>
            <Ionicons name={profile?.isVerified ? 'shield-checkmark' : 'time'} size={14} color={profile?.isVerified ? '#4CAF50' : '#FF9800'} />
            <Text style={[styles.badgeText, { color: profile?.isVerified ? '#4CAF50' : '#FF9800' }]}>{profile?.isVerified ? 'Verified' : 'Pending Verification'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Expert Profile</Text>
            <TouchableOpacity onPress={() => editing ? save() : setEditing(true)} style={[styles.editBtn, { opacity: saving ? 0.6 : 1 }]}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name={editing ? 'checkmark' : 'pencil'} size={14} color="#fff" /><Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text></>}
            </TouchableOpacity>
          </View>

          <View style={[styles.card, shadows.sm]}>
            {editing ? (
              <>
                {[
                  { key: 'qualification', label: 'Qualification', placeholder: 'e.g. B.Sc. Agriculture' },
                  { key: 'specialization', label: 'Specialization', placeholder: 'e.g. Crop Protection' },
                  { key: 'experience', label: 'Experience (years)', placeholder: '5', keyboard: 'numeric' },
                  { key: 'bio', label: 'Bio', placeholder: 'Brief introduction...', multiline: true },
                ].map(f => (
                  <View key={f.key}>
                    <Text style={styles.label}>{f.label}</Text>
                    <TextInput
                      style={[styles.input, f.multiline && { height: 80 }]}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textMuted}
                      value={form[f.key]}
                      onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))}
                      keyboardType={f.keyboard}
                      multiline={f.multiline}
                    />
                  </View>
                ))}
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              </>
            ) : (
              [
                { icon: 'school', label: 'Qualification', val: profile?.qualification },
                { icon: 'leaf', label: 'Specialization', val: profile?.specialization },
                { icon: 'time', label: 'Experience', val: profile?.experience ? `${profile.experience} years` : null },
                { icon: 'chatbubble', label: 'Bio', val: profile?.bio },
              ].map(row => (
                <View key={row.label} style={styles.row}>
                  <View style={styles.rowIcon}><Ionicons name={row.icon} size={16} color="#5C6BC0" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowVal}>{row.val || 'Not set'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', padding: spacing.xl, paddingTop: spacing.xxl },
  heroAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.round },
  badgeText: { fontSize: 12, fontWeight: '700' },
  section: { padding: spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#5C6BC0', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.round },
  editText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EDE7F6', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  rowLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  rowVal: { fontSize: 14, color: colors.text, marginTop: 2, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: 14, color: colors.text, backgroundColor: colors.background, height: 44 },
  cancelBtn: { alignItems: 'center', marginTop: spacing.md },
  cancelText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function MoreMenu({ navigation }) {
  const { t } = useLanguage();
  const { logout } = useAuth();

  const MENU_ITEMS = [
    { icon: 'person-outline', label: 'My Profile', screen: 'Profile', color: colors.primary },
    { icon: 'chatbubbles-outline', label: 'Messages', screen: 'Messages', color: '#1E88E5' },
    { icon: 'git-network-outline', label: 'Connected Retailers', screen: 'ConnectedRetailers', color: '#F4511E' },
    { icon: 'people-outline', label: 'Agronomist Advisories', screen: 'Advisories', color: '#8E24AA' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('More')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={item.screen} 
              style={[styles.menuItem, index !== MENU_ITEMS.length - 1 && styles.borderBottom]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{t(item.label)}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>{t('Logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  scroll: { padding: spacing.md },
  menuGroup: { backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.sm, marginBottom: spacing.xl },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconBox: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: '#FFEbee', borderRadius: borderRadius.lg, ...shadows.sm },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.error, marginLeft: spacing.sm },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplyChainAPI, expertChatAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function ConnectedRetailers({ navigation }) {
  const [connected, setConnected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await supplyChainAPI.getConnectedListings();
      setConnected(res.data.listings || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Retailers</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} /> : (
        <FlatList
          data={connected}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No connected retailers yet. Create supply chain listings to connect!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const retailer = item.retailer || item.collaboratingUser;
            return (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.avatarBg}><Ionicons name="storefront" size={24} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{retailer?.name || 'Retailer'}</Text>
                  <Text style={styles.crop}>Crop: {item.cropName}</Text>
                  <Text style={styles.qty}>{item.quantity} {item.unit} at ₹{item.pricePerUnit}/{item.unit}</Text>
                </View>
                {retailer?._id && (
                  <TouchableOpacity onPress={() => expertChatAPI.initChat(retailer._id, 'supply').then(r => navigation.navigate('Messages', { chatId: r.data.chatId, otherUser: retailer.name }))} style={styles.chatBtn}>
                    <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatarBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  crop: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qty: { fontSize: 11, color: colors.textMuted },
  chatBtn: { padding: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

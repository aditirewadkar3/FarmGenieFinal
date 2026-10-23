import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplyChainAPI, expertChatAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function ConnectedFarmers({ navigation }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await supplyChainAPI.getConnectedListings();
      setFarmers(res.data.listings || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FB8C00', '#FFA726']} style={styles.header}>
        <Text style={styles.title}>Connected Farmers</Text>
        <Text style={styles.sub}>Your supply chain partners</Text>
      </LinearGradient>
      {loading ? <ActivityIndicator size="large" color="#FB8C00" style={{ flex: 1 }} /> : (
        <FlatList
          data={farmers}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FB8C00']} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={48} color={colors.border} /><Text style={styles.emptyText}>No connected farmers yet. Send requests from the Marketplace.</Text></View>}
          renderItem={({ item }) => {
            const farmer = item.farmer || item.collaboratingUser;
            return (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.avatar}><Ionicons name="person" size={26} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{farmer?.name || 'Farmer'}</Text>
                  <Text style={styles.crop}>Crop: {item.cropName}</Text>
                  <Text style={styles.qty}>{item.quantity} {item.unit} · ₹{item.pricePerUnit}/{item.unit}</Text>
                  {farmer?.location?.district && <Text style={styles.loc}>📍 {farmer.location.district}, {farmer.location.state}</Text>}
                </View>
                {farmer?._id && (
                  <TouchableOpacity onPress={() => expertChatAPI.initChat(farmer._id, 'supply').then(r => navigation.navigate('Messages', { chatId: r.data.chatId, otherUser: farmer.name }))}>
                    <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
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
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryPale, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  crop: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  qty: { fontSize: 11, color: colors.textMuted },
  loc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

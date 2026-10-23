import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplyChainAPI, expertChatAPI } from '../../api';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function RetailerMarketplace({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await supplyChainAPI.getNearbyListings(null, null, 100);
      setListings(res.data.listings || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const sendRequest = async (listing) => {
    try {
      await supplyChainAPI.sendRequest({ listingId: listing._id });
      Alert.alert('✅ Request Sent!', `Your collaboration request to ${listing.farmer?.name || 'the farmer'} has been sent.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FB8C00', '#FFA726']} style={styles.header}>
        <Text style={styles.headerTitle}>Farmer Marketplace</Text>
      </LinearGradient>

      {loading ? <ActivityIndicator size="large" color="#FB8C00" style={{ flex: 1 }} /> : (
        <FlatList
          data={listings}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#FB8C00']} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="basket-outline" size={48} color={colors.border} /><Text style={styles.emptyText}>No produce listings nearby right now.</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardTop}>
                <View style={styles.cropIcon}><Text style={{ fontSize: 28 }}>🌾</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.crop}>{item.cropName}</Text>
                  <Text style={styles.farmer}>👤 {item.farmer?.name || 'Local Farmer'}</Text>
                  {item.farmer?.location?.district && <Text style={styles.loc}>📍 {item.farmer.location.district}, {item.farmer.location.state}</Text>}
                </View>
                <View>
                  <Text style={styles.price}>₹{item.pricePerUnit}</Text>
                  <Text style={styles.unit}>/{item.unit}</Text>
                </View>
              </View>
              <Text style={styles.qty}>{item.quantity} {item.unit} available</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.reqBtn} onPress={() => sendRequest(item)}>
                  <Ionicons name="handshake-outline" size={16} color="#FB8C00" />
                  <Text style={styles.reqText}>Send Request</Text>
                </TouchableOpacity>
                {item.farmer?._id && (
                  <TouchableOpacity style={styles.chatBtn} onPress={() => expertChatAPI.initChat(item.farmer._id, 'supply').then(r => navigation.navigate('Messages', { chatId: r.data.chatId, otherUser: item.farmer.name }))}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                    <Text style={styles.chatText}>Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cropIcon: { width: 50, height: 50, borderRadius: borderRadius.md, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  crop: { fontSize: 16, fontWeight: '700', color: colors.text },
  farmer: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  loc: { fontSize: 11, color: colors.textMuted },
  price: { fontSize: 18, fontWeight: '800', color: '#FB8C00', textAlign: 'right' },
  unit: { fontSize: 11, color: colors.textMuted, textAlign: 'right' },
  qty: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  desc: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  reqBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', backgroundColor: '#FFF3E0', padding: spacing.sm, borderRadius: borderRadius.md },
  reqText: { fontSize: 13, fontWeight: '700', color: '#FB8C00' },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', backgroundColor: colors.primaryPale, padding: spacing.sm, borderRadius: borderRadius.md },
  chatText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

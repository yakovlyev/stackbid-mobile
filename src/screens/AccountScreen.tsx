import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing } from '../lib/theme';
import { getStoredUser } from '../lib/storage';
import { getEstimateHistory, createPortalSession, type EstimateHistoryItem } from '../lib/api';

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [estimates, setEstimates] = useState<EstimateHistoryItem[]>([]);

  const load = async () => {
    setLoading(true);
    const user = await getStoredUser();
    setEmail(user.email);
    setFirstName(user.name);
    if (user.email) {
      const data = await getEstimateHistory(user.email);
      setIsPro(data.is_pro);
      setEstimates(data.estimates || []);
    }
    setLoading(false);
  };

  const manageSubscription = async () => {
    setPortalLoading(true);
    const result = await createPortalSession(email);
    setPortalLoading(false);
    if (result.url) {
      await WebBrowser.openBrowserAsync(result.url);
      return;
    }
    Alert.alert("Couldn't open billing", result.error || 'Please try again in a moment.');
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!email) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.emptyText}>Generate your first estimate to create an account.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ''} 👋</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
          <Text style={[styles.badgeText, isPro ? styles.badgeTextPro : styles.badgeTextFree]}>
            {isPro ? '⭐ StackBid Pro' : 'Free plan'}
          </Text>
        </View>
        {isPro && (
          <TouchableOpacity style={styles.manageBtn} onPress={manageSubscription} disabled={portalLoading}>
            {portalLoading ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.manageBtnText}>Manage / Cancel Subscription</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your estimates</Text>
      {estimates.length === 0 ? (
        <Text style={styles.emptyText}>No saved estimates yet.</Text>
      ) : (
        <FlatList
          data={estimates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title || item.project_type || 'Estimate'}
              </Text>
              <Text style={styles.cardMeta}>
                ZIP {item.zip} · {new Date(item.created_at).toLocaleDateString()}
              </Text>
              {item.total_local != null && (
                <Text style={styles.cardPrice}>${Math.round(item.total_local).toLocaleString()} local supplier</Text>
              )}
            </View>
          )}
        />
      )}

      {!isPro && estimates.length > 0 && (
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  header: { marginBottom: spacing.xl },
  greeting: { fontSize: 20, fontWeight: '800', color: colors.ink },
  email: { fontSize: 13, color: colors.muted, marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: spacing.sm },
  badgePro: { backgroundColor: '#FFF3DE' },
  badgeFree: { backgroundColor: colors.offwhite },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextPro: { color: colors.goldDark },
  badgeTextFree: { color: colors.muted },
  manageBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  manageBtnText: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  card: { backgroundColor: colors.offwhite, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  cardMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  cardPrice: { fontSize: 12, fontWeight: '700', color: colors.green, marginTop: 4 },
  refreshBtn: { alignSelf: 'center', paddingVertical: spacing.md },
  refreshBtnText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
});

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing } from '../lib/theme';
import { createCheckoutSession } from '../lib/api';

interface Props {
  visible: boolean;
  email: string;
  onClose: () => void;
}

const PERKS = [
  'Unlimited material estimates',
  'Save your project history',
  'Price drop alerts',
  'Priority contractor matching',
  'Detailed supplier PDF reports',
];

export default function PaywallModal({ visible, email, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    const result = await createCheckoutSession(email);
    setLoading(false);
    if (result.url) {
      await WebBrowser.openBrowserAsync(result.url);
      return;
    }
    Alert.alert(
      'Subscriptions are launching very soon!',
      `We'll email you at ${email} the moment StackBid Pro is live.`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.title}>You've used your free estimate</Text>
          <Text style={styles.subtitle}>Subscribe to StackBid Pro to keep estimating and unlock more</Text>

          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceNum}>$9.99</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
            {PERKS.map((p) => (
              <Text key={p} style={styles.perk}>✓ {p}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.subBtn} onPress={subscribe} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.subBtnText}>Subscribe to StackBid Pro</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(12,35,64,0.55)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md, padding: 4 },
  closeBtnText: { fontSize: 16, color: colors.muted },
  emoji: { fontSize: 28, textAlign: 'center', marginBottom: spacing.xs },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: spacing.lg },
  priceBox: { backgroundColor: colors.offwhite, borderRadius: 10, padding: spacing.lg, marginBottom: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: spacing.md },
  priceNum: { fontSize: 28, fontWeight: '800', color: colors.ink },
  pricePeriod: { fontSize: 13, color: colors.muted },
  perk: { fontSize: 13, color: colors.ink, marginBottom: spacing.sm },
  subBtn: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  subBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
});

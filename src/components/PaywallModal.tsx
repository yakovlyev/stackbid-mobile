import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing } from '../lib/theme';
import { createCheckoutSession, logConsent } from '../lib/api';

interface Props {
  visible: boolean;
  email: string;
  onClose: () => void;
}

const PERKS = [
  'Unlimited material estimates',
  'Save your project history',
  'Price drop alerts',
  'Access to local contractor listings',
  'Detailed supplier PDF reports',
];

const CONSENT_TEXT =
  'I understand this is a monthly subscription for $9.99 that renews automatically until canceled, and that I can cancel anytime in my account.';

export default function PaywallModal({ visible, email, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [consented, setConsented] = useState(false);

  const subscribe = async () => {
    if (!consented) {
      Alert.alert('Please confirm', 'Check the box confirming you understand this is a recurring subscription.');
      return;
    }
    setLoading(true);
    await logConsent(email, CONSENT_TEXT);
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
          <Text style={styles.title}>Unlock unlimited estimates</Text>
          <Text style={styles.subtitle}>Your first estimate was free. Keep planning with StackBid Pro.</Text>

          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceNum}>$9.99</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
            <Text style={styles.disclosure}>Billed monthly. Renews automatically until canceled.</Text>
            {PERKS.map((p) => (
              <Text key={p} style={styles.perk}>✓ {p}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.consentRow} onPress={() => setConsented(!consented)} activeOpacity={0.8}>
            <View style={[styles.checkbox, consented && styles.checkboxChecked]}>
              {consented && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>{CONSENT_TEXT}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subBtn, !consented && styles.subBtnDisabled]}
            onPress={subscribe}
            disabled={loading || !consented}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.subBtnText}>Continue and unlock my plan</Text>}
          </TouchableOpacity>
          <Text style={styles.microcopy}>You will not be charged unless you confirm this subscription.</Text>
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
  priceBox: { backgroundColor: colors.offwhite, borderRadius: 10, padding: spacing.lg, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 4 },
  priceNum: { fontSize: 28, fontWeight: '800', color: colors.ink },
  pricePeriod: { fontSize: 13, color: colors.muted },
  disclosure: { fontSize: 11.5, color: colors.muted, textAlign: 'center', marginBottom: spacing.md },
  perk: { fontSize: 13, color: colors.ink, marginBottom: spacing.sm },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.offwhite,
    borderRadius: 8,
    padding: 10,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkmark: { color: colors.white, fontSize: 12, fontWeight: '700' },
  consentText: { flex: 1, fontSize: 11.5, color: colors.ink, lineHeight: 16 },
  subBtn: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  subBtnDisabled: { opacity: 0.5 },
  subBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  microcopy: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});

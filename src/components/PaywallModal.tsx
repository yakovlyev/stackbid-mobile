import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { colors, spacing } from '../lib/theme';
import { getProOffering, purchasePro, restorePurchases, identifyPurchaser } from '../lib/purchases';
import { logConsent } from '../lib/api';

interface Props {
  visible: boolean;
  email: string;
  onClose: () => void;
  onUnlocked: () => void;
}

const PERKS = [
  'Unlimited material estimates',
  'Save your project history',
  'Price drop alerts',
  'Access to local contractor listings',
  'Detailed supplier PDF reports',
];

// Apple/Google require the price + renewal terms to be disclosed before purchase,
// but the actual charge confirmation UI belongs to their native purchase sheet —
// we don't show our own "Continue and unlock" payment button, StoreKit/Play Billing does.
const DISCLOSURE_TEXT =
  'Monthly subscription, renews automatically until canceled. Manage or cancel anytime in your device account settings.';

export default function PaywallModal({ visible, email, onClose, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [priceString, setPriceString] = useState('$9.99');

  useEffect(() => {
    if (!visible) return;
    (async () => {
      if (email) await identifyPurchaser(email);
      const offering = await getProOffering();
      const monthly = offering?.availablePackages.find((p) => p.packageType === 'MONTHLY') || offering?.availablePackages[0] || null;
      setPkg(monthly);
      if (monthly?.product?.priceString) setPriceString(monthly.product.priceString);
    })();
  }, [visible, email]);

  const handlePurchase = async () => {
    if (!pkg) {
      Alert.alert('Subscriptions are launching very soon!', `We'll email you at ${email} the moment StackBid Pro is live.`);
      return;
    }
    setLoading(true);
    if (email) {
      // Proof-of-consent log — same disclosure text, same table as web, timestamped before the store purchase sheet opens.
      await logConsent(email, DISCLOSURE_TEXT);
    }
    const result = await purchasePro(pkg);
    setLoading(false);
    if (result.success) {
      onUnlocked();
      onClose();
    } else if (!result.userCancelled) {
      Alert.alert('Purchase failed', result.error || "Please try again — you haven't been charged.");
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.success) {
      onUnlocked();
      onClose();
    } else {
      Alert.alert('No active subscription found', 'If you believe this is a mistake, contact hello@stackbid.app.');
    }
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
              <Text style={styles.priceNum}>{priceString}</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
            <Text style={styles.disclosure}>{DISCLOSURE_TEXT}</Text>
            {PERKS.map((p) => (
              <Text key={p} style={styles.perk}>✓ {p}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.subBtn} onPress={handlePurchase} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.subBtnText}>Continue and unlock my plan</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>{restoring ? 'Checking…' : 'Restore purchase'}</Text>
          </TouchableOpacity>

          <Text style={styles.microcopy}>
            Price and terms confirmed on the next screen before you're charged.
          </Text>
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
  subBtn: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  subBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  restoreBtn: { alignItems: 'center', marginTop: spacing.sm, padding: 6 },
  restoreBtnText: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  microcopy: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});

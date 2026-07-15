import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../lib/theme';
import type { Estimate } from '../lib/types';

interface Props {
  visible: boolean;
  estimate: Estimate | null;
  onUnlock: (fname: string, email: string, role: string) => void;
}

export default function GateModal({ visible, estimate, onUnlock }: Props) {
  const [fname, setFname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('homeowner');

  const items = (estimate?.categories || []).flatMap((c) => c.items).slice(0, 3);
  const totalItems = (estimate?.categories || []).reduce((n, c) => n + c.items.length, 0);

  const submit = () => {
    if (!fname.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    onUnlock(fname.trim(), email.trim(), role);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.centerWrap} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.emoji}>🔓</Text>
            <Text style={styles.title}>Your estimate is ready</Text>
            <Text style={styles.subtitle}>Enter your details to unlock the full breakdown</Text>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview — first {items.length} of {totalItems} items</Text>
              {items.map((item, i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.previewPrice}>${Math.round(item.local_unit * item.qty)}</Text>
                </View>
              ))}
              <Text style={styles.moreLocked}>+ {Math.max(totalItems - items.length, 0)} more items locked</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Your first name"
              placeholderTextColor={colors.muted}
              value={fname}
              onChangeText={setFname}
            />
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.roleRow}>
              {['homeowner', 'contractor', 'investor', 'realtor'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePill, role === r && styles.rolePillActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.unlockBtn} onPress={submit}>
              <Text style={styles.unlockBtnText}>🔓 Unlock full estimate — free</Text>
            </TouchableOpacity>
            <Text style={styles.fineprint}>No spam. Unsubscribe anytime.</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(12,35,64,0.55)' },
  centerWrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl },
  emoji: { fontSize: 28, textAlign: 'center', marginBottom: spacing.xs },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },
  previewBox: { backgroundColor: colors.offwhite, borderRadius: 10, padding: spacing.md, marginBottom: spacing.lg },
  previewLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  previewName: { fontSize: 13, color: colors.ink, fontWeight: '500', flex: 1, marginRight: spacing.sm },
  previewPrice: { fontSize: 13, color: colors.green, fontWeight: '600' },
  moreLocked: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.ink,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg },
  rolePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  rolePillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  rolePillText: { fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
  rolePillTextActive: { color: colors.white },
  unlockBtn: { backgroundColor: colors.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  unlockBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  fineprint: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});

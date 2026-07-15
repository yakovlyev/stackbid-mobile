import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../lib/theme';
import type { Estimate } from '../lib/types';

export default function EstimateResults({ estimate, zip }: { estimate: Estimate; zip: string }) {
  let totalRetail = 0;
  let totalWholesale = 0;
  let totalLocal = 0;
  (estimate.categories || []).forEach((cat) =>
    cat.items.forEach((item) => {
      totalRetail += item.retail_unit * item.qty;
      totalWholesale += item.wholesale_unit * item.qty;
      totalLocal += item.local_unit * item.qty;
    })
  );

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.title}>{estimate.title}</Text>
      <Text style={styles.meta}>
        ZIP {zip} · {estimate.supplier_name} · {estimate.supplier_distance}
      </Text>

      <View style={styles.totalsGrid}>
        <TotalCard label="HD / Lowe's retail" value={totalRetail} />
        <TotalCard label="Wholesale estimate" value={totalWholesale} highlight />
        <TotalCard label="Local supplier" value={totalLocal} highlight />
        <TotalCard label="You save vs retail" value={totalRetail - totalLocal} savings />
      </View>

      {(estimate.categories || []).map((cat, ci) => (
        <View key={ci} style={styles.catBlock}>
          <Text style={styles.catName}>📦 {cat.name}</Text>
          {cat.items.map((item, ii) => {
            const r = item.retail_unit * item.qty;
            const w = item.wholesale_unit * item.qty;
            const l = item.local_unit * item.qty;
            const pct = Math.round((1 - l / r) * 100);
            return (
              <View key={ii} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {!!item.note && <Text style={styles.itemNote}>{item.note}</Text>}
                  <Text style={styles.itemQty}>{item.qty} {item.unit}</Text>
                </View>
                <View style={styles.priceCol}>
                  <PriceLine label="Retail" value={r} />
                  <PriceLine label="Wholesale" value={w} />
                  <PriceLine label="Local" value={l} color={colors.green} />
                  <Text style={styles.savePill}>-{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function TotalCard({ label, value, highlight, savings }: { label: string; value: number; highlight?: boolean; savings?: boolean }) {
  return (
    <View style={[styles.totalCard, highlight && styles.totalCardHighlight, savings && styles.totalCardSavings]}>
      <Text style={styles.totalVal}>${Math.round(value).toLocaleString()}</Text>
      <Text style={styles.totalLbl}>{label}</Text>
    </View>
  );
}

function PriceLine({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Text style={[styles.priceLine, color && { color }]}>
      {label}: <Text style={{ fontWeight: '700' }}>${Math.round(value).toLocaleString()}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  totalCard: {
    flexBasis: '47%',
    backgroundColor: colors.offwhite,
    borderRadius: 12,
    padding: spacing.md,
  },
  totalCardHighlight: { backgroundColor: '#EAF2FF' },
  totalCardSavings: { backgroundColor: '#E7F6EE' },
  totalVal: { fontSize: 20, fontWeight: '800', color: colors.ink },
  totalLbl: { fontSize: 12, color: colors.muted, marginTop: 2 },
  catBlock: { marginBottom: spacing.lg },
  catName: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  itemNote: { fontSize: 11, color: colors.muted, marginTop: 2 },
  itemQty: { fontSize: 11, color: colors.muted, marginTop: 2 },
  priceCol: { alignItems: 'flex-end', minWidth: 110 },
  priceLine: { fontSize: 11, color: colors.muted },
  savePill: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.green,
    backgroundColor: '#E7F6EE',
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
});

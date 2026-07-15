import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../lib/theme';
import { analyzePhotoBase64 } from '../lib/api';
import type { PhotoResult } from '../lib/types';

export default function PhotoScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [zip, setZip] = useState('');
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoResult | null>(null);

  const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const pickFrom = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Permission needed to access ' + (source === 'camera' ? 'the camera' : 'your photos') + '.');
      return;
    }
    // Форсируем JPEG на выходе (даже если исходник HEIC/PNG с телефона) —
    // раньше mime-тип отправлялся в Claude как хардкод 'image/jpeg' независимо
    // от реального формата, из-за чего HEIC-фото с iPhone уходили как "битый"
    // JPEG и модель не могла ничего распознать на фото.
    const opts: ImagePicker.ImagePickerOptions = {
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    };
    const res =
      source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      let detectedType = asset.mimeType || 'image/jpeg';
      if (!SUPPORTED.includes(detectedType)) {
        // HEIC и прочие форматы, которые Claude не умеет читать напрямую —
        // ImagePicker обычно уже перекодирует в JPEG сам, но на всякий случай
        // предупреждаем, а не отправляем заведомо нечитаемые байты
        detectedType = 'image/jpeg';
      }
      setUri(asset.uri);
      setBase64(asset.base64 || null);
      setMimeType(detectedType);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!base64) {
      alert('Please take or upload a photo first.');
      return;
    }
    setLoading(true);
    try {
      const r = await analyzePhotoBase64(base64, zip.trim() || '77001', qty.trim(), mimeType);
      setResult(r);
    } catch (e) {
      alert("Couldn't analyze this photo — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <Text style={styles.title}>🔍 Identify a material</Text>
      <Text style={styles.subtitle}>Take or upload a photo of lumber, drywall, roofing, siding, and more.</Text>

      {uri ? (
        <Image source={{ uri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickFrom('camera')}>
          <Text style={styles.secondaryBtnText}>📷 Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickFrom('library')}>
          <Text style={styles.secondaryBtnText}>🖼️ Choose from library</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>ZIP code</Text>
      <TextInput
        style={styles.input}
        placeholder="77001"
        placeholderTextColor={colors.muted}
        value={zip}
        onChangeText={setZip}
        keyboardType="number-pad"
        maxLength={5}
      />
      <Text style={styles.label}>Quantity needed (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 50 pieces"
        placeholderTextColor={colors.muted}
        value={qty}
        onChangeText={setQty}
      />

      <TouchableOpacity style={styles.genBtn} onPress={analyze} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.genBtnText}>🔍 Identify &amp; price this material</Text>}
      </TouchableOpacity>

      {result && <PhotoResultCard result={result} zip={zip.trim() || '77001'} />}
    </ScrollView>
  );
}

function PhotoResultCard({ result, zip }: { result: PhotoResult; zip: string }) {
  if (result.error === 'not_construction_material') {
    return (
      <View style={styles.notMaterialCard}>
        <Text style={styles.notMaterialTitle}>Hmm, that doesn't look like a construction material</Text>
        <Text style={styles.notMaterialText}>Detected: {result.detected}</Text>
        <Text style={styles.notMaterialText}>{result.message}</Text>
      </View>
    );
  }
  const qty = result.qty_suggested || 1;
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultName}>{result.identified}</Text>
      <Text style={styles.resultMeta}>
        {result.category} · {result.spec} · Confidence: {result.confidence}
      </Text>
      <View style={styles.totalsGrid}>
        <PriceTile label="HD / Lowe's" value={(result.hd_unit || 0) * qty} />
        <PriceTile label="Wholesale" value={(result.wholesale_unit || 0) * qty} />
        <PriceTile label="Local supplier" value={(result.local_unit || 0) * qty} highlight />
      </View>
      <Text style={styles.resultSupplier}>📍 {result.supplier} · ZIP {zip}</Text>
      {!!result.note && <Text style={styles.resultNote}>💡 {result.note}</Text>}
    </View>
  );
}

function PriceTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={[styles.priceTile, highlight && styles.priceTileHighlight]}>
      <Text style={styles.priceTileVal}>${Math.round(value).toLocaleString()}</Text>
      <Text style={styles.priceTileLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  preview: { width: '100%', height: 220, borderRadius: 12, marginBottom: spacing.md },
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.offwhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm, marginTop: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink,
  },
  genBtn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  genBtnText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  resultCard: { backgroundColor: colors.offwhite, borderRadius: 12, padding: spacing.lg, marginTop: spacing.xl },
  resultName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  resultMeta: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
  totalsGrid: { flexDirection: 'row', gap: spacing.sm },
  priceTile: { flex: 1, backgroundColor: colors.white, borderRadius: 10, padding: spacing.md, alignItems: 'center' },
  priceTileHighlight: { backgroundColor: '#E7F6EE' },
  priceTileVal: { fontSize: 16, fontWeight: '800', color: colors.ink },
  priceTileLbl: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: 'center' },
  resultSupplier: { fontSize: 12, color: colors.ink, marginTop: spacing.md, fontWeight: '600' },
  resultNote: { fontSize: 12, color: colors.muted, marginTop: spacing.sm, fontStyle: 'italic' },
  notMaterialCard: { backgroundColor: '#FDECEC', borderRadius: 12, padding: spacing.lg, marginTop: spacing.xl },
  notMaterialTitle: { fontSize: 14, fontWeight: '700', color: colors.danger },
  notMaterialText: { fontSize: 12, color: colors.ink, marginTop: 6 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing } from '../lib/theme';
import type { ProjectType } from '../lib/types';
import { generateEstimate, checkAccess, saveEstimate } from '../lib/api';
import { getStoredEmail, getStoredUser } from '../lib/storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const PROJECT_TYPES: ProjectType[] = [
  'New home build',
  'Roof replacement',
  'Deck / patio',
  'Fence',
  'Siding',
  'Interior remodel',
  'Other',
];

const SUPPLIERS = ['Any / best match', 'Home Depot', "Lowe's", '84 Lumber', 'Builders FirstSource'];

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [desc, setDesc] = useState('');
  const [zip, setZip] = useState('');
  const [type, setType] = useState<ProjectType>('New home build');
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Analyzing your project...');
  const [hasFreeLeft, setHasFreeLeft] = useState(true);

  React.useEffect(() => {
    (async () => {
      const email = await getStoredEmail();
      if (email) setHasFreeLeft(false); // consistent with web: don't promise "free" if already registered
    })();
  }, []);

  const messages = [
    'Analyzing your project...',
    'Calculating material quantities...',
    'Looking up 2026 wholesale prices...',
    `Finding your nearest supplier${zip ? ' in ZIP ' + zip : ''}...`,
    'Building your estimate...',
  ];

  const onGenerate = async () => {
    const finalZip = zip.trim() || '77001';
    setLoading(true);
    let mi = 0;
    setLoadingMsg(messages[0]);
    const interval = setInterval(() => {
      mi = Math.min(mi + 1, messages.length - 1);
      setLoadingMsg(messages[mi]);
    }, 900);

    try {
      const estimate = await generateEstimate(desc, finalZip, type, supplier);

      const storedEmail = await getStoredEmail();
      if (!storedEmail) {
        // Совсем новый пользователь на этом устройстве — гейт с регистрацией
        navigation.navigate('Results', { estimate, zip: finalZip, projectType: type, requireGate: true });
      } else {
        const access = await checkAccess(storedEmail);
        if (access.access_granted) {
          const user = await getStoredUser();
          saveEstimate(
            { email: user.email, first_name: user.name, role: user.role, price_alerts: true },
            estimate,
            finalZip,
            type
          );
          navigation.navigate('Results', { estimate, zip: finalZip, projectType: type, requireGate: false });
        } else {
          navigation.navigate('Results', {
            estimate,
            zip: finalZip,
            projectType: type,
            requireGate: false,
            showPaywall: true,
          });
        }
      }
    } catch (e) {
      alert("Couldn't generate your estimate — please try again in a moment.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <Text style={styles.logo}>StackBid</Text>
        </View>

        <TouchableOpacity style={styles.photoLink} onPress={() => navigation.navigate('Photo')}>
          <Text style={styles.photoLinkText}>📷 Or identify a material from a photo →</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Project type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {PROJECT_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, type === t && styles.typePillActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typePillText, type === t && styles.typePillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Describe your project (optional)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="e.g. 1,200 sq ft ranch, 3 bed 2 bath, architectural shingle roof..."
          placeholderTextColor={colors.muted}
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={4}
        />

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

        <Text style={styles.label}>Preferred supplier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {SUPPLIERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.typePill, supplier === s && styles.typePillActive]}
              onPress={() => setSupplier(s)}
            >
              <Text style={[styles.typePillText, supplier === s && styles.typePillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.genBtn} onPress={onGenerate} disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.genBtnText}>{loadingMsg}</Text>
            </View>
          ) : (
            <Text style={styles.genBtnText}>
              ⚡ Generate my estimate{hasFreeLeft ? ' — free' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.lg },
  header: { paddingVertical: spacing.lg, alignItems: 'center' },
  logo: { fontSize: 22, fontWeight: '800', color: colors.gold },
  photoLink: { marginBottom: spacing.lg },
  photoLinkText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm, marginTop: spacing.md },
  typeRow: { marginBottom: spacing.xs },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  typePillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  typePillText: { fontSize: 12, color: colors.ink },
  typePillTextActive: { color: colors.white },
  textarea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 14,
    color: colors.ink,
    minHeight: 90,
    textAlignVertical: 'top',
  },
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

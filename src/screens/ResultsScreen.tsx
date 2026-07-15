import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../App';
import EstimateResults from '../components/EstimateResults';
import GateModal from '../components/GateModal';
import PaywallModal from '../components/PaywallModal';
import { saveUser, getStoredEmail } from '../lib/storage';
import { saveEstimate } from '../lib/api';
import { colors } from '../lib/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Results'>;

export default function ResultsScreen({ route, navigation }: Props) {
  const { estimate, zip, projectType, requireGate, showPaywall } = route.params;
  const [gateOpen, setGateOpen] = useState(!!requireGate);
  const [paywallOpen, setPaywallOpen] = useState(!!showPaywall);
  const [unlocked, setUnlocked] = useState(!requireGate);
  const [email, setEmail] = useState('');

  const onUnlock = async (fname: string, unlockEmail: string, role: string) => {
    await saveUser(unlockEmail, fname, role);
    saveEstimate({ email: unlockEmail, first_name: fname, role, price_alerts: true }, estimate, zip, projectType);
    setGateOpen(false);
    setUnlocked(true);
  };

  React.useEffect(() => {
    (async () => {
      const stored = await getStoredEmail();
      if (stored) setEmail(stored);
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      {unlocked && <EstimateResults estimate={estimate} zip={zip} />}
      <GateModal visible={gateOpen} estimate={estimate} onUnlock={onUnlock} />
      <PaywallModal visible={paywallOpen} email={email} onClose={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white },
});

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import type { Estimate, ProjectType } from './src/lib/types';
import { colors } from './src/lib/theme';

export type RootStackParamList = {
  Home: undefined;
  Photo: undefined;
  Results: {
    estimate: Estimate;
    zip: string;
    projectType: ProjectType;
    requireGate?: boolean;
    showPaywall?: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.ink },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'StackBid' }} />
          <Stack.Screen name="Photo" component={PhotoScreen} options={{ title: 'Identify material' }} />
          <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Your estimate' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

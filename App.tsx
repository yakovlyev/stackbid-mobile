import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import AccountScreen from './src/screens/AccountScreen';
import type { Estimate, ProjectType } from './src/lib/types';
import { colors } from './src/lib/theme';
import { configurePurchases } from './src/lib/purchases';

export type HomeStackParamList = {
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

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'StackBid' }} />
      <HomeStack.Screen name="Photo" component={PhotoScreen} options={{ title: 'Identify material' }} />
      <HomeStack.Screen name="Results" component={ResultsScreen} options={{ title: 'Your estimate' }} />
    </HomeStack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    configurePurchases();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.ink,
            tabBarInactiveTintColor: colors.muted,
          }}
        >
          <Tab.Screen
            name="Estimate"
            component={HomeStackNavigator}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text> }}
          />
          <Tab.Screen
            name="Account"
            component={AccountScreen}
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.ink },
              headerTintColor: colors.white,
              title: 'My account',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

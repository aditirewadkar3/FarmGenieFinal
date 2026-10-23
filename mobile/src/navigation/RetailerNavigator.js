import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

import RetailerDashboard from '../screens/retailer/RetailerDashboard';
import RetailerMarketplace from '../screens/retailer/RetailerMarketplace';
import ConnectedFarmers from '../screens/retailer/ConnectedFarmers';
import Profile from '../screens/shared/Profile';
import Messages from '../screens/shared/Messages';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RetailerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          const icons = { Dashboard: 'home', Marketplace: 'storefront', 'Connected Farmers': 'people' };
          return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={RetailerDashboard} />
      <Tab.Screen name="Marketplace" component={RetailerMarketplace} />
      <Tab.Screen name="Connected Farmers" component={ConnectedFarmers} />
    </Tab.Navigator>
  );
}

export default function RetailerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RetailerTabs" component={RetailerTabs} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Messages" component={Messages} />
    </Stack.Navigator>
  );
}

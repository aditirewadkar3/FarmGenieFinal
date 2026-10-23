import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboard from '../screens/admin/AdminDashboard';
import Farmers, { Agronomists, Seeds, Fertilizers, Facilities } from '../screens/admin/Farmers';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 4 },
        tabBarIcon: ({ color }) => {
          const icons = { Dashboard: 'home', Farmers: 'people', Agronomists: 'school', 'Manage': 'settings' };
          return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Farmers" component={Farmers} />
      <Tab.Screen name="Agronomists" component={Agronomists} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="Seeds" component={Seeds} />
      <Stack.Screen name="Fertilizers" component={Fertilizers} />
      <Stack.Screen name="Facilities" component={Facilities} />
    </Stack.Navigator>
  );
}

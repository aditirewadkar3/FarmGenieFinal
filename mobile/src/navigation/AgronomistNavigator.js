import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

import AgronomistDashboard from '../screens/agronomist/AgronomistDashboard';
import AgronomistProfile from '../screens/agronomist/AgronomistProfile';
import Messages from '../screens/shared/Messages';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AgronomistTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60, paddingBottom: 4 },
        tabBarIcon: ({ color }) => {
          const icons = { Dashboard: 'home', Profile: 'person', Messages: 'chatbubbles' };
          return <Ionicons name={icons[route.name] || 'grid'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AgronomistDashboard} />
      <Tab.Screen name="Profile" component={AgronomistProfile} />
      <Tab.Screen name="Messages" component={Messages} />
    </Tab.Navigator>
  );
}

export default function AgronomistNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgronomistTabs" component={AgronomistTabs} />
    </Stack.Navigator>
  );
}

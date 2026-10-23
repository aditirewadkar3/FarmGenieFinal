import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

import FarmerDashboard from '../screens/farmer/FarmerDashboard';
import Crops from '../screens/farmer/Crops';
import Market from '../screens/farmer/Market';
import Weather from '../screens/farmer/Weather';
import Schemes from '../screens/farmer/Schemes';
import EquipmentMarketplace from '../screens/farmer/EquipmentMarketplace';
import DiseaseDetection from '../screens/farmer/DiseaseDetection';
import SupplyChain from '../screens/farmer/SupplyChain';
import Advisories from '../screens/farmer/Advisories';
import ConnectedRetailers from '../screens/farmer/ConnectedRetailers';
import AIChat from '../screens/farmer/AIChat';
import Profile from '../screens/shared/Profile';
import Messages from '../screens/shared/Messages';
import MoreMenu from '../screens/farmer/MoreMenu';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function FarmerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'home',
            Crops: 'leaf',
            Market: 'trending-up',
            Weather: 'partly-sunny',
            More: 'grid',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={FarmerDashboard} />
      <Tab.Screen name="Crops" component={Crops} />
      <Tab.Screen name="Market" component={Market} />
      <Tab.Screen name="Weather" component={Weather} />
      <Tab.Screen name="More" component={MoreMenu} />
    </Tab.Navigator>
  );
}

export default function FarmerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FarmerTabs" component={FarmerTabs} />
      <Stack.Screen name="Schemes" component={Schemes} />
      <Stack.Screen name="Equipment" component={EquipmentMarketplace} />
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetection} />
      <Stack.Screen name="SupplyChain" component={SupplyChain} />
      <Stack.Screen name="Advisories" component={Advisories} />
      <Stack.Screen name="ConnectedRetailers" component={ConnectedRetailers} />
      <Stack.Screen name="AIChat" component={AIChat} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Messages" component={Messages} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme';

import LoginScreen from '../screens/auth/Login';
import RegisterScreen from '../screens/auth/Register';

import FarmerNavigator from './FarmerNavigator';
import RetailerNavigator from './RetailerNavigator';
import AgronomistNavigator from './AgronomistNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getNavigatorForRole = (role) => {
    switch (role) {
      case 'farmer': return <Stack.Screen name="FarmerApp" component={FarmerNavigator} />;
      case 'retailer': return <Stack.Screen name="RetailerApp" component={RetailerNavigator} />;
      case 'agronomist': return <Stack.Screen name="AgronomistApp" component={AgronomistNavigator} />;
      case 'admin': return <Stack.Screen name="AdminApp" component={AdminNavigator} />;
      default: return null;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          getNavigatorForRole(user.role)
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

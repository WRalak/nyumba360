import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Landlord Screens
import LandlordDashboardScreen from '../screens/landlord/LandlordDashboardScreen';
import PropertiesScreen from '../screens/landlord/PropertiesScreen';
import PropertyDetailScreen from '../screens/landlord/PropertyDetailScreen';
import TenantsScreen from '../screens/landlord/TenantsScreen';
import PaymentsScreen from '../screens/landlord/PaymentsScreen';
import MaintenanceScreen from '../screens/landlord/MaintenanceScreen';
import ProfileScreen from '../screens/landlord/ProfileScreen';

// Tenant Screens
import TenantDashboardScreen from '../screens/tenant/TenantDashboardScreen';
import RentPaymentScreen from '../screens/tenant/RentPaymentScreen';
import MaintenanceRequestScreen from '../screens/tenant/MaintenanceRequestScreen';
import TenantProfileScreen from '../screens/tenant/TenantProfileScreen';

// Debug Screen
import DebugScreen from '../screens/DebugScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LandlordTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Properties':
              iconName = 'apartment';
              break;
            case 'Tenants':
              iconName = 'people';
              break;
            case 'Payments':
              iconName = 'payments';
              break;
            case 'Maintenance':
              iconName = 'build';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={LandlordDashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const TenantTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Rent':
              iconName = 'payment';
              break;
            case 'Maintenance':
              iconName = 'build';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={TenantDashboardScreen} />
      <Tab.Screen name="Rent" component={RentPaymentScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceRequestScreen} />
      <Tab.Screen name="Profile" component={TenantProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
    </Stack.Navigator>
  );
};

const LandlordNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LandlordTabs" component={LandlordTabs} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </Stack.Navigator>
  );
};

const TenantNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TenantTabs" component={TenantTabs} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (user?.user_type === 'landlord') {
    return <LandlordNavigator />;
  } else if (user?.user_type === 'tenant') {
    return <TenantNavigator />;
  }

  return <AuthNavigator />;
};

export default AppNavigator;

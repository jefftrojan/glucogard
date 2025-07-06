import { Tabs } from 'expo-router';
import { Chrome as Home, Activity, MapPin, User, Database } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

import { View } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Render a loading state or a placeholder while auth is resolving
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: 'white' }} />;
  }

  // The AuthProvider will handle redirection if the user is not authenticated.
  // This component should focus solely on rendering the tab layout.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="assessment"
        options={{
          title: 'Health Check',
          tabBarIcon: ({ size, color }) => <Activity size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="location"
        options={{
          title: 'Health Map',
          tabBarIcon: ({ size, color }) => <MapPin size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="research"
        options={{
          title: 'Research',
          tabBarIcon: ({ size, color }) => <Database size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

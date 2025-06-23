import { Tabs } from 'expo-router';
import { Chrome as Home, Activity, MapPin, User } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

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
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
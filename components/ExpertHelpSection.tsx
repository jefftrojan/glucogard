import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { 
  Stethoscope, 
  Star, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Video,
  Phone,
  ChevronRight,
  Award,
  Users,
  Calendar,
  Heart
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  profiles: {
    full_name: string;
  };
  rating?: number;
  experience_years?: number;
  consultation_fee?: number;
  availability_status?: 'available' | 'busy' | 'offline';
  location?: string;
  languages?: string[];
  verified?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function ExpertHelpSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const cardsScale = useSharedValue(0.9);

  useEffect(() => {
    fetchDoctors();
    
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    cardsScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          specialization,
          profiles!inner (
            full_name
          )
        `)
        .limit(6);

      if (error) {
        console.error('Error fetching doctors:', error);
      } else {
        // Add mock data for demo purposes
        const doctorsWithMockData = (data || []).map((doctor, index) => ({
          ...doctor,
          rating: 4.2 + (Math.random() * 0.8), // 4.2 - 5.0
          experience_years: 5 + Math.floor(Math.random() * 15), // 5-20 years
          consultation_fee: 25 + Math.floor(Math.random() * 50), // $25-75
          availability_status: ['available', 'busy', 'offline'][Math.floor(Math.random() * 3)] as 'available' | 'busy' | 'offline',
          location: ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri'][Math.floor(Math.random() * 4)],
          languages: [['English', 'Kinyarwanda'], ['English', 'French'], ['Kinyarwanda', 'Swahili']][Math.floor(Math.random() * 3)],
          verified: Math.random() > 0.3, // 70% verified
        }));
        setDoctors(doctorsWithMockData);
      }
    } catch (error) {
      console.error('Unexpected error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'busy':
        return '#F59E0B';
      case 'offline':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available Now';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [20, 0]) }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardsScale.value }],
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Finding expert doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Stethoscope size={24} color="#0066CC" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Get Expert Help</Text>
            <Text style={styles.headerSubtitle}>
              Connect with qualified healthcare professionals
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={16} color="#0066CC" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={cardsAnimatedStyle}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.doctorsContainer}
          style={styles.doctorsScroll}
        >
          {doctors.map((doctor, index) => (
            <AnimatedTouchableOpacity
              key={doctor.id}
              style={[
                styles.doctorCard,
                selectedDoctor === doctor.id && styles.selectedDoctorCard
              ]}
              onPress={() => setSelectedDoctor(doctor.id)}
              activeOpacity={0.8}
            >
              {/* Doctor Avatar */}
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ 
                    uri: `https://images.pexels.com/photos/${
                      [5327585, 4173239, 4173251, 4173252, 4173253, 4173254][index % 6]
                    }/pexels-photo-${
                      [5327585, 4173239, 4173251, 4173252, 4173253, 4173254][index % 6]
                    }.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop`
                  }}
                  style={styles.avatar}
                />
                {doctor.verified && (
                  <View style={styles.verifiedBadge}>
                    <Award size={12} color="#FFD700" />
                  </View>
                )}
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getAvailabilityColor(doctor.availability_status || 'offline') }
                ]} />
              </View>

              {/* Doctor Info */}
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  Dr. {doctor.profiles.full_name}
                </Text>
                <Text style={styles.specialization} numberOfLines={1}>
                  {doctor.specialization || 'General Medicine'}
                </Text>
                
                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.rating}>
                    {doctor.rating?.toFixed(1) || '4.5'}
                  </Text>
                  <Text style={styles.ratingCount}>
                    ({Math.floor(Math.random() * 100) + 20})
                  </Text>
                </View>

                {/* Experience & Location */}
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.metaText}>
                      {doctor.experience_years || 8}y exp
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.metaText}>
                      {doctor.location || 'Kigali'}
                    </Text>
                  </View>
                </View>

                {/* Availability */}
                <View style={styles.availabilityContainer}>
                  <View style={[
                    styles.availabilityDot,
                    { backgroundColor: getAvailabilityColor(doctor.availability_status || 'offline') }
                  ]} />
                  <Text style={[
                    styles.availabilityText,
                    { color: getAvailabilityColor(doctor.availability_status || 'offline') }
                  ]}>
                    {getAvailabilityText(doctor.availability_status || 'offline')}
                  </Text>
                </View>

                {/* Consultation Fee */}
                <Text style={styles.consultationFee}>
                  ${doctor.consultation_fee || 35}/consultation
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={16} color="#0066CC" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Video size={16} color="#0066CC" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Phone size={16} color="#0066CC" />
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedTouchableOpacity>
          ))}

        </ScrollView>
      </Animated.View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Heart size={20} color="#DC3545" />
          <Text style={styles.statNumber}>{doctors.length}+</Text>
          <Text style={styles.statLabel}>Expert Doctors</Text>
        </View>
        <View style={styles.statItem}>
          <Calendar size={20} color="#28A745" />
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={20} color="#FFD700" />
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
  },
  doctorsScroll: {
    marginBottom: 20,
  },
  doctorsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  doctorCard: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDoctorCard: {
    borderColor: '#0066CC',
    transform: [{ scale: 1.02 }],
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 24,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  doctorInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  specialization: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748B',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
});
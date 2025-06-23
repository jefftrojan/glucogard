import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Shield, MapPin, Brain, ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  image: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to GlucoGard AI',
    subtitle: 'Your Health Companion',
    description: 'Take control of your health with personalized diabetes risk assessment and smart recommendations.',
    icon: Heart,
    color: '#FF6B6B',
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 2,
    title: 'Smart Health Assessment',
    subtitle: 'Adaptive & Personalized',
    description: 'Our AI-powered questionnaire adapts to your responses, making health assessment quick and relevant.',
    icon: Brain,
    color: '#4ECDC4',
    image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 3,
    title: 'Location-Based Care',
    subtitle: 'Find Help Nearby',
    description: 'Discover nearby health centers, clinics, and resources tailored to your location and needs.',
    icon: MapPin,
    color: '#45B7D1',
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 4,
    title: 'Privacy & Security',
    subtitle: 'Your Data is Safe',
    description: 'We protect your health data with industry-standard encryption and comply with Rwanda\'s privacy laws.',
    icon: Shield,
    color: '#96CEB4',
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/auth');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const skip = () => {
    router.replace('/auth');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const IconComponent = item.icon;
    
    return (
      <View style={[styles.slide, { backgroundColor: `${item.color}15` }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.slideImage} />
          <View style={[styles.iconOverlay, { backgroundColor: item.color }]}>
            <IconComponent size={40} color="white" />
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity,
                  transform: [{ scale }],
                  backgroundColor: index === currentIndex ? slides[currentIndex].color : '#E0E0E0',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={slidesRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={32}
      />

      {renderPagination()}

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={goToPrevious}
          style={[styles.navButton, { opacity: currentIndex === 0 ? 0.3 : 1 }]}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNext}
          style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
        >
          {currentIndex === slides.length - 1 ? (
            <Text style={styles.nextButtonText}>Get Started</Text>
          ) : (
            <ChevronRight size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    marginBottom: 40,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -20,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
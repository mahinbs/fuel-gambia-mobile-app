import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../../utils/storage';

const { width } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  description: string;
  gradientColors: string[];
}

const slides: Slide[] = [
  {
    icon: 'water',
    title: 'National Fuel Subsidies',
    description: 'Empowering Gambian citizens and government departments with smart, digital fuel allocation and subsidy management.',
    gradientColors: ['#007AFF', '#5856D6'],
  },
  {
    icon: 'qr-code',
    title: 'Digital QR Coupons',
    description: 'Generate secure QR coupons instantly to pay for fuel at any station. Attendants scan and approve transactions in seconds.',
    gradientColors: ['#5856D6', '#FF2D55'],
  },
  {
    icon: 'wallet',
    title: 'Smart Wallet Tracking',
    description: 'Track fuel usage, monthly allocations, and remaining balances in real-time. Manage everything seamlessly on the go.',
    gradientColors: ['#34C759', '#007AFF'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    Storage.set('has_seen_onboarding', true);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: slide.gradientColors[0] + '15' }]}>
              <Ionicons name={slide.icon as any} size={80} color={slide.gradientColors[0]} />
            </View>
            
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>

        <Button
          title={activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.actionButton}
        />
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
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#007AFF',
  },
  actionButton: {
    width: '100%',
  },
});


import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { usePremium } from '@/contexts/PremiumContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const { upgradeToPremium } = usePremium();

  const handleUpgrade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!user) {
      Alert.alert(
        'Account Required',
        'Please create an account to upgrade to Premium.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Account',
            onPress: () => {
              onClose();
              router.push('/auth');
            },
          },
        ]
      );
      return;
    }

    // For Expo Go testing, simulate premium upgrade
    Alert.alert(
      'Upgrade to Premium',
      'In production, this would connect to your payment provider. For now, would you like to activate Premium for testing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate Premium',
          onPress: async () => {
            try {
              await upgradeToPremium();
              Alert.alert('Success!', 'Premium features activated! 🎉');
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to activate premium. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                android_material_icon_name="close"
                ios_icon_name="xmark"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.badge, { backgroundColor: theme.primary + '20', color: theme.primary }]}>
                  PREMIUM
                </Text>
                <Text style={[styles.title, { color: theme.text }]}>
                  Unlock Unlimited Habits
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Take your habit tracking to the next level
                </Text>
              </View>

              {/* Features */}
              <View style={styles.features}>
                <FeatureItem
                  icon="check-circle"
                  title="Unlimited Habits"
                  description="Create as many habits as you need"
                  theme={theme}
                />
                <FeatureItem
                  icon="image"
                  title="Custom Icons"
                  description="Upload your own habit icons from your photo gallery"
                  theme={theme}
                />
                <FeatureItem
                  icon="sync"
                  title="Cloud Sync"
                  description="Access your habits across all devices"
                  theme={theme}
                />
                <FeatureItem
                  icon="insights"
                  title="Advanced Analytics"
                  description="Deep insights into your habit patterns"
                  theme={theme}
                />
              </View>

              {/* Pricing */}
              <View style={[styles.pricingCard, { backgroundColor: theme.highlight }]}>
                <Text style={[styles.price, { color: theme.text }]}>$4.99/month</Text>
                <Text style={[styles.priceSubtext, { color: theme.textSecondary }]}>
                  Cancel anytime
                </Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeButtonText}>
                  {user ? 'Upgrade to Premium' : 'Create Account & Upgrade'}
                </Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={[styles.terms, { color: theme.textSecondary }]}>
                By subscribing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  theme,
}: {
  icon: string;
  title: string;
  description: string;
  theme: any;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
        <IconSymbol
          android_material_icon_name={icon as any}
          ios_icon_name={icon}
          size={24}
          color={theme.primary}
        />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  features: {
    gap: 20,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 20,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
  },
  upgradeButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});


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
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { usePremium } from '@/contexts/PremiumContext';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { showPaywall } = usePremium();
  const { user } = useAuth();

  const handleUpgrade = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // If user is not authenticated, redirect to auth screen
    if (!user) {
      onClose();
      router.push('/auth');
      return;
    }

    // Show Superwall paywall
    await showPaywall();
  };

  const premiumFeatures = [
    {
      icon: 'all-inclusive',
      title: 'Unlimited Habits',
      description: 'Create as many habits as you need to reach your goals',
    },
    {
      icon: 'photo-library',
      title: 'Custom Icons',
      description: 'Upload your own images from your photo gallery',
    },
    {
      icon: 'group',
      title: 'Social Features',
      description: 'Create groups and track habits with friends & family',
    },
    {
      icon: 'insights',
      title: 'Advanced Analytics',
      description: 'Get deeper insights into your habit patterns',
    },
    {
      icon: 'cloud-sync',
      title: 'Cloud Sync',
      description: 'Access your habits across all your devices',
    },
    {
      icon: 'support',
      title: 'Priority Support',
      description: 'Get help when you need it most',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.background }]}>
            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.highlight }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <IconSymbol
                android_material_icon_name="close"
                ios_icon_name="xmark"
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                  <IconSymbol
                    android_material_icon_name="star"
                    ios_icon_name="star.fill"
                    size={24}
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Upgrade to Premium
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Free users can create up to 3 habits. Unlock unlimited habits and more with Premium.
                </Text>
              </View>

              {/* Features */}
              <View style={styles.features}>
                {premiumFeatures.map((feature, index) => (
                  <View
                    key={index}
                    style={[
                      styles.featureItem,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                      <IconSymbol
                        android_material_icon_name={feature.icon}
                        ios_icon_name={feature.icon}
                        size={24}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>
                        {feature.title}
                      </Text>
                      <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>
                  {user ? 'Continue to Premium' : 'Create Account & Subscribe'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
                {user 
                  ? 'Subscription will be tied to your account'
                  : 'You\'ll create an account as part of the subscription process'
                }
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modal: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  features: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

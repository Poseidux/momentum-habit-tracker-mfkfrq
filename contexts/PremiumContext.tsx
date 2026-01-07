
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { SuperwallProvider, useUser, usePlacement } from 'expo-superwall';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  showPaywall: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// Superwall API key - Replace with your actual key
const SUPERWALL_API_KEY = 'pk_test_your_key_here'; // TODO: Replace with actual RevenueCat testing key

export function SuperwallWrapper({ children }: { children: ReactNode }) {
  return (
    <SuperwallProvider 
      apiKeys={{ 
        ios: SUPERWALL_API_KEY,
        android: SUPERWALL_API_KEY 
      }}
      onConfigurationError={(error) => {
        console.error('Superwall configuration error:', error);
      }}
    >
      {children}
    </SuperwallProvider>
  );
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { subscriptionStatus, identify } = useUser();
  const { registerPlacement } = usePlacement({
    onDismiss: (info, result) => {
      console.log('Paywall dismissed:', result);
      // Check subscription status after paywall dismissal
      checkPremiumStatus();
    },
    onError: (error) => {
      console.error('Paywall error:', error);
    },
  });

  useEffect(() => {
    checkPremiumStatus();
  }, [subscriptionStatus, user]);

  useEffect(() => {
    // Identify user with Superwall when authenticated
    if (user?.id) {
      identify(user.id).catch(console.error);
    }
  }, [user?.id]);

  const checkPremiumStatus = async () => {
    try {
      // Check for developer account
      if (user?.email === 'developerposeiduxfu39a33es@gmail.com') {
        setIsPremium(true);
        setIsLoading(false);
        return;
      }

      // Check Superwall subscription status
      const isActive = subscriptionStatus?.status === 'ACTIVE';
      setIsPremium(isActive);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const showPaywall = async () => {
    try {
      await registerPlacement({
        placement: 'habit_limit', // Configure this placement in Superwall dashboard
        feature: () => {
          // User has premium access
          console.log('Premium feature unlocked');
          setIsPremium(true);
        },
      });
    } catch (error) {
      console.error('Error showing paywall:', error);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        showPaywall,
        checkPremiumStatus,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
}

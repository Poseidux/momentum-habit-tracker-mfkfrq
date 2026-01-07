
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  showPaywall: () => void;
  checkPremiumStatus: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_KEY = '@momentum_premium_status';
const DEVELOPER_EMAIL = 'developerposeiduxfu39a33es@gmail.com';

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      // Developer bypass
      if (user?.email === DEVELOPER_EMAIL) {
        console.log('[Premium] Developer account detected - granting premium access');
        setIsPremium(true);
        setLoading(false);
        return;
      }

      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored) {
        const premiumData = JSON.parse(stored);
        setIsPremium(premiumData.isPremium || false);
        console.log('[Premium] Loaded premium status:', premiumData.isPremium);
      } else {
        console.log('[Premium] No premium status found - user is free tier');
      }
    } catch (error) {
      console.error('[Premium] Error checking premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    try {
      console.log('[Premium] Upgrading user to premium');
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify({ isPremium: true }));
      setIsPremium(true);
    } catch (error) {
      console.error('[Premium] Error upgrading to premium:', error);
      throw error;
    }
  };

  const showPaywall = () => {
    console.log('[Premium] Paywall requested - will be shown via PaywallModal component');
  };

  return (
    <PremiumContext.Provider value={{ isPremium, loading, showPaywall, checkPremiumStatus, upgradeToPremium }}>
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

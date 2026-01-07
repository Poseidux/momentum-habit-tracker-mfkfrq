
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  checkPremiumStatus: () => Promise<void>;
  setPremiumStatus: (status: boolean) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_KEY = '@momentum_premium';
const DEV_EMAIL = 'developerposeiduxfu39a33es@gmail.com';

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
      if (user?.email === DEV_EMAIL) {
        setIsPremium(true);
        setLoading(false);
        return;
      }

      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      setIsPremium(stored === 'true');
    } catch (error) {
      console.error('Failed to check premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPremiumStatus = async (status: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, status.toString());
      setIsPremium(status);
    } catch (error) {
      console.error('Failed to set premium status:', error);
    }
  };

  const upgradeToPremium = async () => {
    await setPremiumStatus(true);
  };

  return (
    <PremiumContext.Provider value={{
      isPremium,
      loading,
      checkPremiumStatus,
      setPremiumStatus,
      upgradeToPremium,
    }}>
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

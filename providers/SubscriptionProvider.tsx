import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOfferings, LOG_LEVEL } from 'react-native-purchases';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from './AuthProvider';

// RevenueCat API Keys (set these in your .env file)
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';

// RevenueCat Entitlement ID (configure in RevenueCat dashboard)
const ENTITLEMENT_ID = 'loveticket Premium';

type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';
type SubscriptionTier = 'weekly' | 'monthly' | 'yearly';

type SubscriptionContextType = {
  // Subscription state
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionTier: SubscriptionTier | null;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;

  // Loading states
  isLoading: boolean;
  isPurchasing: boolean;

  // Actions
  purchasePackage: (packageIdentifier: 'monthly' | 'weekly') => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  subscriptionStatus: null,
  subscriptionTier: null,
  customerInfo: null,
  offerings: null,
  isLoading: true,
  isPurchasing: false,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  refreshCustomerInfo: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile, isSignedIn } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const updateSubscriptionStatus = useMutation(api.users.updateSubscriptionStatus);

  // Determine if user has premium access
  const isPremium = customerInfo?.activeSubscriptions?.length > 0 ||
    customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;

  // Get subscription tier from customerInfo
  const getSubscriptionTier = useCallback((): SubscriptionTier | null => {
    if (!customerInfo?.activeSubscriptions?.length) return null;

    const productId = customerInfo.activeSubscriptions[0];
    if (productId.includes('weekly')) return 'weekly';
    if (productId.includes('monthly')) return 'monthly';
    if (productId.includes('yearly')) return 'yearly';
    return 'monthly'; // default
  }, [customerInfo]);

  const subscriptionTier = getSubscriptionTier();

  // Get subscription status
  const getSubscriptionStatus = useCallback((): SubscriptionStatus => {
    if (!customerInfo) return 'free';
    if (customerInfo.activeSubscriptions?.length > 0) return 'active';
    if (customerInfo.entitlements?.active?.[ENTITLEMENT_ID]) return 'active';
    if (customerInfo.managementURL) return 'expired'; // Had subscription before
    return 'free';
  }, [customerInfo]);

  const subscriptionStatus = customerInfo ? getSubscriptionStatus() : null;

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (!isSignedIn || !profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Set log level for debugging
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // Configure RevenueCat with API key
        const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;

        if (!apiKey) {
          console.warn('RevenueCat API key not configured');
          setIsLoading(false);
          return;
        }

        // Initialize Purchases
        await Purchases.configure({ apiKey, appUserID: profile.id });

        // Log in user with their Clerk ID
        await Purchases.logIn(profile.id);

        // Get customer info and offerings
        const [info, offs] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        setCustomerInfo(info);
        setOfferings(offs);

        setIsConfigured(true);
        console.log('RevenueCat initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, [isSignedIn, profile?.id]);

  // Clean up on sign-out
  useEffect(() => {
    if (!isSignedIn && isConfigured) {
      Purchases.logOut().catch(console.error);
      setIsConfigured(false);
      setCustomerInfo(null);
      setOfferings(null);
    }
  }, [isSignedIn, isConfigured]);

  // Listen to customer info updates (only after RevenueCat is configured)
  useEffect(() => {
    if (!isConfigured) return;

    const customerInfoListener = (info: CustomerInfo) => {
      setCustomerInfo(info);

      // Sync with Convex
      if (profile?.id) {
        const tier = info.activeSubscriptions?.length > 0
          ? info.activeSubscriptions[0].includes('weekly') ? 'weekly' :
            info.activeSubscriptions[0].includes('yearly') ? 'yearly' : 'monthly'
          : undefined;

        const status = info.activeSubscriptions?.length > 0 ? 'active' : 'free';

        updateSubscriptionStatus({
          clerkId: profile.id,
          status,
          tier,
        }).catch(console.error);
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, [isConfigured, profile?.id, updateSubscriptionStatus]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
    }
  }, []);

  // Purchase package
  const purchasePackage = useCallback(async (packageIdentifier: 'monthly' | 'weekly'): Promise<boolean> => {
    if (!offerings?.current) {
      console.error('No offerings available');
      return false;
    }

    const packageToPurchase = packageIdentifier === 'monthly'
      ? offerings.current.monthly
      : offerings.current.weekly;

    if (!packageToPurchase) {
      console.error(`Package ${packageIdentifier} not found`);
      return false;
    }

    setIsPurchasing(true);

    try {
      const { customerInfo: newInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(newInfo);

      // Update Convex
      if (profile?.id) {
        await updateSubscriptionStatus({
          clerkId: profile.id,
          status: 'active',
          tier: packageIdentifier,
        });
      }

      return true;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase failed:', error);
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [offerings, profile?.id, updateSubscriptionStatus]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);

      // Update Convex if user has active subscription
      if (profile?.id && restoredInfo.activeSubscriptions?.length > 0) {
        const tier = restoredInfo.activeSubscriptions[0].includes('weekly') ? 'weekly' :
          restoredInfo.activeSubscriptions[0].includes('yearly') ? 'yearly' : 'monthly';

        await updateSubscriptionStatus({
          clerkId: profile.id,
          status: 'active',
          tier,
        });
      }

      return restoredInfo.activeSubscriptions?.length > 0;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  }, [profile?.id, updateSubscriptionStatus]);

  const value: SubscriptionContextType = {
    isPremium,
    subscriptionStatus,
    subscriptionTier,
    customerInfo,
    offerings,
    isLoading,
    isPurchasing,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

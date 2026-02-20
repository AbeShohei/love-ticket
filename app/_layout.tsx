import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProvider } from 'convex/react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '@/utils/tokenCache';
import { ConvexReactClient } from 'convex/react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set root view background color
SystemUI.setBackgroundColorAsync('white');

import { AdMobProvider } from '@/providers/AdMobProvider';

// Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl || '');

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    ...FontAwesome5.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Show warning if Clerk key is not configured
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY - using dummy auth');
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || ''} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexProvider client={convex}>
          <AdMobProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </AdMobProvider>
        </ConvexProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

import { usePushNotifications } from '@/components/PushNotificationHandler';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize Push Notifications
  usePushNotifications();

  // Auth + Pairing redirect logic
  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) return;

    // Wait for profile to be available after sign in
    if (isSignedIn && profile === null) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const inPairing = segments[0] === 'pairing' || segments[0] === 'pair';
    const inProfileSetup = segments[0] === 'profile-setup';

    if (!isSignedIn && !inAuthGroup) {
      // Not signed in - redirect to login
      router.replace('/login');
    } else if (isSignedIn && profile) {
      // User is signed in and profile is loaded
      const hasAvatar = !!profile.avatarUrl;
      const isPaired = !!profile.coupleId;

      if (inAuthGroup) {
        // On auth screens after login
        if (isPaired) {
          router.replace('/' as any);
        } else if (!hasAvatar) {
          router.replace('/profile-setup');
        } else {
          router.replace('/pairing');
        }
      } else if (!hasAvatar && !inProfileSetup) {
        // No avatar - redirect to profile setup
        router.replace('/profile-setup');
      } else if (hasAvatar && !isPaired && !inPairing && !inProfileSetup) {
        // Trying to access app without pairing
        router.replace('/pairing');
      } else if (hasAvatar && !isPaired && inProfileSetup) {
        // User finished setup (has avatar) but still on setup screen -> go to pairing
        router.replace('/pairing');
      }
    }
  }, [isSignedIn, isLoading, segments, profile]);

  // Show loading while checking auth or waiting for profile
  if (isLoading || (isSignedIn && profile === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF4B4B" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="proposals/create" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="pairing" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}

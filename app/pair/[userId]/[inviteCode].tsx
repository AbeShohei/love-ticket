import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { api } from '@/convex/_generated/api';
import { useTranslation } from 'react-i18next';

export default function PairDeepLink() {
  const { t } = useTranslation();
  const { userId, inviteCode } = useLocalSearchParams<{ userId: string; inviteCode: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const joinCouple = useMutation(api.couples.join);
  const coupleInfo = useQuery(api.couples.getByInviteCode, { inviteCode: inviteCode || '' });
  const joinAttempted = useRef(false);

  useEffect(() => {
    async function handlePairing() {
      if (joinAttempted.current) return;

      if (!inviteCode || !profile?._id) {
        if (!profile?._id) {
          router.replace('/login');
          return;
        }
        setLoading(false);
        return;
      }

      if (coupleInfo === undefined) {
        return;
      }

      if (!coupleInfo) {
        setError(t('pairing.invalidInviteCode'));
        setLoading(false);
        return;
      }

      if (profile.coupleId) {
        if (profile.coupleId === coupleInfo._id) {
          router.replace('/' as any);
          return;
        } else {
          setError(t('pairing.alreadyInCouple'));
          setLoading(false);
          return;
        }
      }

      joinAttempted.current = true;
      try {
        await joinCouple({ userId: profile._id, inviteCode });
        router.replace('/' as any);
      } catch (err) {
        joinAttempted.current = false;
        setError(t('pairing.pairingFailed'));
      } finally {
        setLoading(false);
      }
    }

    handlePairing();
  }, [inviteCode, profile?._id, coupleInfo, t]);

  if (loading || coupleInfo === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fd297b" />
        <Text style={styles.loadingText}>{t('pairing.pairingInProgress')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Heart size={64} color="#FF4B4B" style={{ marginBottom: 24 }} />
        <Text style={styles.errorTitle}>{t('common.error')}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.hint} onPress={() => router.replace('/pairing')}>
          {t('pairing.enterInviteCodeManually')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fd297b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#fd297b',
    textDecorationLine: 'underline',
  },
});

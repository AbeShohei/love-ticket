import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { api } from '@/convex/_generated/api';

export default function PairDeepLink() {
  const { userId, inviteCode } = useLocalSearchParams<{ userId: string; inviteCode: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const joinCouple = useMutation(api.couples.join);
  const coupleInfo = useQuery(api.couples.getByInviteCode, { inviteCode: inviteCode || '' });

  useEffect(() => {
    async function handlePairing() {
      if (!inviteCode || !profile?._id) {
        if (!profile?._id) {
          // User not logged in, redirect to login
          router.replace('/login');
          return;
        }
        setLoading(false);
        return;
      }

      // Check if the couple exists
      if (coupleInfo === undefined) {
        // Still loading
        return;
      }

      if (!coupleInfo) {
        setError('無効な招待コードです');
        setLoading(false);
        return;
      }

      // Check if user is already in a couple
      if (profile.coupleId) {
        if (profile.coupleId === coupleInfo._id) {
          // Already in this couple
          router.replace('/' as any);
          return;
        } else {
          setError('既に他のカップルに参加しています');
          setLoading(false);
          return;
        }
      }

      // Join the couple
      try {
        await joinCouple({ userId: profile._id, inviteCode });
        router.replace('/' as any);
      } catch (err) {
        console.error('Failed to join couple:', err);
        setError('ペアリングに失敗しました');
      } finally {
        setLoading(false);
      }
    }

    handlePairing();
  }, [inviteCode, profile?._id, coupleInfo]);

  if (loading || coupleInfo === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fd297b" />
        <Text style={styles.loadingText}>ペアリング中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Heart size={64} color="#FF4B4B" style={{ marginBottom: 24 }} />
        <Text style={styles.errorTitle}>エラー</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.hint} onPress={() => router.replace('/pairing')}>
          手動で招待コードを入力する
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

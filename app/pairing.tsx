import { QRScanner } from '@/components/QRScanner';
import { useAuth } from '@/providers/AuthProvider';
import { generatePairingUrl, isValidInviteCode } from '@/utils/qrCode';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, QrCode, ScanLine } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Pairing() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [createdCoupleId, setCreatedCoupleId] = useState<Id<"couples"> | null>(null);
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const redirectAttempted = useRef(false);

  const createCouple = useMutation(api.couples.create);
  const joinCouple = useMutation(api.couples.join);

  // Check if already paired
  const existingCouple = useQuery(
    api.couples.getById,
    profile?.coupleId ? { id: profile.coupleId } : 'skip'
  );

  // Watch for partner joining (when couple becomes active)
  const coupleData = useQuery(
    api.couples.getById,
    createdCoupleId ? { id: createdCoupleId } : 'skip'
  );

  // Combined redirect check - use any source for active status
  useEffect(() => {
    const isActive = coupleData?.status === 'active' ||
      existingCouple?.status === 'active';

    if (isActive && !redirectAttempted.current) {
      console.log('[Pairing] ✅ ACTIVE status detected! Redirecting...');
      redirectAttempted.current = true;
      router.replace('/(tabs)/profile');
    }
  }, [coupleData, existingCouple, router]);

  async function handleCreateCouple() {
    if (!profile?._id) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    setLoading(true);
    try {
      const result = await createCouple({ userId: profile._id });
      setGeneratedCode(result.inviteCode);
      setCreatedCoupleId(result.coupleId);
    } catch (error) {
      console.error('Failed to create couple:', error);
      Alert.alert('エラー', 'カップルの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinCouple() {
    if (!inviteCode) {
      Alert.alert('エラー', '招待コードを入力してください');
      return;
    }

    if (!isValidInviteCode(inviteCode)) {
      Alert.alert('エラー', '招待コードの形式が正しくありません');
      return;
    }

    if (!profile?._id) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    await performJoinCouple(inviteCode);
  }

  async function performJoinCouple(code: string) {
    setLoading(true);
    try {
      await joinCouple({ userId: profile!._id, inviteCode: code });
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Failed to join couple:', error);
      Alert.alert('エラー', '無効な招待コードです');
    } finally {
      setLoading(false);
    }
  }

  async function handleQRScanSuccess(data: { userId: string; inviteCode: string }) {
    setShowQRScanner(false);

    if (!profile?._id) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    // QRコードから取得した招待コードで参加
    Alert.alert(
      'ペアリング確認',
      `招待コード: ${data.inviteCode} \n\nこのカップルに参加しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '参加する',
          onPress: () => performJoinCouple(data.inviteCode)
        }
      ]
    );
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('コピーしました', '招待コードをクリップボードにコピーしました');
  };

  const shareCode = async () => {
    if (generatedCode) {
      await Share.share({
        message: `Love Ticket に参加しよう！招待コード: ${generatedCode} `
      });
    }
  };

  const pairingUrl = profile ? generatePairingUrl(profile._id, generatedCode) : '';

  // QR Scanner Modal
  if (showQRScanner) {
    return (
      <QRScanner
        onScanSuccess={handleQRScanSuccess}
        onClose={() => setShowQRScanner(false)}
      />
    );
  }

  if (generatedCode) {
    // Show status for debugging - use any available source
    const statusText = coupleData?.status || existingCouple?.status || 'loading';
    const isStatusActive = statusText === 'active';

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setGeneratedCode('');
            setCreatedCoupleId(null);
            redirectAttempted.current = false;
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#666" />
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>

        <Heart size={64} color="#FF4B4B" style={{ marginBottom: 24 }} />
        <Text style={styles.title}>カップルを作成しました！ 🎉</Text>
        <Text style={styles.subtitle}>パートナーにQRコードや招待コードを送ってください：</Text>

        <TouchableOpacity style={styles.codeContainer} onPress={copyToClipboard}>
          <Text style={styles.codeText}>{generatedCode}</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.qrButton} onPress={() => setShowQRModal(true)}>
            <QrCode size={24} color="#fd297b" />
            <Text style={styles.qrButtonText}>QRコード</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={shareCode}>
            <Text style={styles.buttonText}>コードを共有</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.waitingText}>
          パートナーが参加するまでお待ちください...
        </Text>

        {/* Debug status indicator */}
        <Text style={[styles.statusText, isStatusActive && styles.statusActive]}>
          ステータス: {statusText} {isStatusActive ? '✅' : '⏳'}
        </Text>

        {/* QR Code Display Modal */}
        <Modal
          visible={showQRModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
              <TouchableOpacity
                style={styles.qrModalClose}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.qrModalCloseText}>閉じる</Text>
              </TouchableOpacity>

              <Text style={styles.qrModalTitle}>QRコードでペアリング</Text>
              <Text style={styles.qrModalSubtitle}>
                パートナーにこのQRコードをスキャンしてもらってください
              </Text>

              <View style={styles.qrCodeContainer}>
                {pairingUrl && (
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pairingUrl)}&bgcolor=ffffff&color=333333`
                    }}
                    style={{ width: 220, height: 220 }}
                    contentFit="contain"
                  />
                )}
              </View >

              <Text style={styles.inviteCodeLabel}>招待コード</Text>
              <Text style={styles.inviteCodeText}>{generatedCode}</Text>
            </View >
          </View >
        </Modal >
      </View >
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>ペアリング</Text>
      <Text style={styles.subtitle}>パートナーと連携しましょう</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'create' && styles.activeToggle]}
          onPress={() => setMode('create')}
        >
          <Text style={[styles.toggleText, mode === 'create' && styles.activeToggleText]}>新しく始める</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'join' && styles.activeToggle]}
          onPress={() => setMode('join')}
        >
          <Text style={[styles.toggleText, mode === 'join' && styles.activeToggleText]}>参加する</Text>
        </TouchableOpacity>
      </View>

      {mode === 'create' ? (
        <View style={styles.content}>
          <Text style={styles.description}>
            新しくカップル専用のスペースを作成し、パートナーに共有するための招待コードを発行します。
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateCouple}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>招待コードを発行する</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.description}>
            パートナーから受け取ったQRコードをスキャンするか、招待コードを入力してください。
          </Text>

          <TextInput
            style={styles.input}
            placeholder="招待コードを入力 (例: A1B2C3)"
            placeholderTextColor="#aaa"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleJoinCouple}
            disabled={loading || !inviteCode}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>カップルに参加する</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* QR Scanner Button */}
          <TouchableOpacity
            style={styles.qrScanButton}
            onPress={() => setShowQRScanner(true)}
          >
            <ScanLine size={24} color="#fd297b" />
            <Text style={styles.qrScanButtonText}>QRコードをスキャン</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 22,
  },
  activeToggle: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontWeight: '600',
    color: '#999',
  },
  activeToggleText: {
    color: '#FF4B4B',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  qrScanButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(253, 41, 123, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(253, 41, 123, 0.3)',
  },
  qrScanButtonText: {
    color: '#fd297b',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
    marginHorizontal: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 2,
    backgroundColor: '#f9f9f9',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF4B4B',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 0,
  },
  secondaryButtonText: {
    color: '#666',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: '#333',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  qrButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fd297b',
  },
  qrButtonText: {
    color: '#fd297b',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  statusActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // QR Modal Styles
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: SCREEN_WIDTH - 40,
    maxWidth: 360,
  },
  qrModalClose: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  qrModalCloseText: {
    color: '#666',
    fontSize: 16,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  qrModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#333',
  },
});

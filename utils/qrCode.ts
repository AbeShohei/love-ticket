/**
 * QR Code utilities for pairing functionality
 */

// Deep link URL scheme
const URL_SCHEME = 'love-ticket';

// Pairing URL format: love-ticket://pair/{userId}/{inviteCode}
export interface PairingData {
  userId: string;
  inviteCode: string;
}

/**
 * Generate a pairing URL from user ID and invite code
 */
export function generatePairingUrl(userId: string, inviteCode: string): string {
  return `${URL_SCHEME}://pair/${userId}/${inviteCode}`;
}

/**
 * Parse a pairing URL to extract user ID and invite code
 * Returns null if URL is invalid
 */
export function parsePairingUrl(url: string): PairingData | null {
  // Use regex for reliable parsing across all platforms
  const match = url.match(/^love-ticket:\/\/pair\/([^/]+)\/([A-Z0-9]{6})$/i);
  if (match) {
    return { userId: match[1], inviteCode: match[2].toUpperCase() };
  }
  return null;
}

/**
 * Validate invite code format (6 alphanumeric characters)
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(code);
}

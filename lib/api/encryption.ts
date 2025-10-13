import CryptoJS from 'crypto-js';

/**
 * Encryption utility for securing API keys in localStorage
 * Uses AES encryption with a secret key from environment variables
 */

const getEncryptionKey = (): string => {
  const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_ENCRYPTION_KEY environment variable is not set');
  }
  return key;
};

/**
 * Encrypts a string using AES encryption
 * @param text - The plain text to encrypt
 * @returns The encrypted string
 */
export function encrypt(text: string): string {
  try {
    const encryptionKey = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(text, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an AES encrypted string
 * @param encryptedText - The encrypted text to decrypt
 * @returns The decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const encryptionKey = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plainText) {
      throw new Error('Decryption resulted in empty string');
    }

    return plainText;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Securely stores the API key in localStorage
 * @param apiKey - The API key to store
 */
export function storeApiKey(apiKey: string): void {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is only available in browser environment');
  }

  const encrypted = encrypt(apiKey);
  localStorage.setItem('twenty_api_key', encrypted);
}

/**
 * Retrieves and decrypts the API key from localStorage
 * @returns The decrypted API key or null if not found
 */
export function getApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const encrypted = localStorage.getItem('twenty_api_key');
  if (!encrypted) {
    return null;
  }

  try {
    return decrypt(encrypted);
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    // If decryption fails, remove the corrupted key
    localStorage.removeItem('twenty_api_key');
    return null;
  }
}

/**
 * Removes the API key from localStorage
 */
export function removeApiKey(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('twenty_api_key');
}

/**
 * Client Avatar Utilities & Persistence
 * Integrates shared demo avatars with browser localStorage & client-side compression
 */

import { DEMO_AVATARS, DemoAvatar, getBotAvatar } from '@shared/utils/avatar';

export { DEMO_AVATARS, getBotAvatar };
export type { DemoAvatar };

const STORAGE_KEY = 'zhs_player_avatar';

/**
 * Returns saved avatar from localStorage or default avatar 4
 */
export function getSavedAvatar(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch (err) {
    console.warn('Unable to access localStorage for avatar', err);
  }
  return DEMO_AVATARS[3].svgDataUri; // Young player by default
}

/**
 * Saves avatar data URI to localStorage
 */
export function saveAvatar(avatarUri: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, avatarUri);
  } catch (err) {
    console.warn('Unable to save avatar in localStorage', err);
  }
}

/**
 * Compresses an uploaded image file into a compact JPEG Base64 thumbnail (max 128x128)
 */
export async function compressAndSaveAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to process image canvas'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG at 0.82 quality for ultra compact payload (<10KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        saveAvatar(dataUrl);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}


import { useState, useEffect } from 'react';
import { initLiff, getLineProfile, liff } from '../lib/liff';

interface LiffContextType {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string;
  displayName: string;
  pictureUrl: string;
  error: string | null;
}

const IS_DEV_MOCK =
  import.meta.env.DEV && import.meta.env.VITE_LIFF_ID === 'mock';

export function useLiff(): LiffContextType {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 開発環境でモック
        if (IS_DEV_MOCK) {
          setIsReady(true);
          setIsLoggedIn(true);
          setUserId('dev-mock-user-001');
          setDisplayName('テストユーザー');
          setPictureUrl('');
          return;
        }

        await initLiff();

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await getLineProfile();
        if (profile) {
          setIsLoggedIn(true);
          setUserId(profile.userId);
          setDisplayName(profile.displayName);
          setPictureUrl(profile.pictureUrl || '');
        }

        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize LIFF');
        setIsReady(true);
      }
    };

    init();
  }, []);

  return {
    isReady,
    isLoggedIn,
    userId,
    displayName,
    pictureUrl,
    error,
  };
}

import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;

export async function initLiff(): Promise<void> {
  if (!LIFF_ID) {
    throw new Error('LIFF ID is not set in environment variables');
  }
  await liff.init({ liffId: LIFF_ID });
}

export async function getLineProfile() {
  if (!liff.isLoggedIn()) return null;
  return liff.getProfile();
}

export { liff };

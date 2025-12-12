import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database } from 'firebase/database';
import { MatchDetails } from '../types';

let db: Database | null = null;

export const initFirebase = (config: any) => {
  try {
    if (!getApps().length) {
      const app = initializeApp(config);
      db = getDatabase(app);
    } else {
      const app = getApp();
      db = getDatabase(app);
    }
    return true;
  } catch (error) {
    console.error("Firebase Init Error:", error);
    return false;
  }
};

export const subscribeToMatches = (
  onData: (matches: MatchDetails[]) => void, 
  onError: (msg: string) => void
) => {
  if (!db) {
    onError("Firebase yapılandırılmadı.");
    return () => {};
  }

  const matchesRef = ref(db, 'matches');
  
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Data might be an object or array depending on how Apps Script pushed it
      // Standardize to array
      const matchesArray = Array.isArray(data) ? data : Object.values(data);
      onData(matchesArray as MatchDetails[]);
    } else {
      onData([]);
    }
  }, (error) => {
    onError(error.message);
  });

  // Return cleanup function
  return () => off(matchesRef);
};
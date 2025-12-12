import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, set, get, query, orderByChild, equalTo, Database } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, Auth, onAuthStateChanged, User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { MatchDetails } from '../types';

let db: Database | null = null;
let auth: Auth | null = null;

export const initFirebase = (config: any) => {
  try {
    let app;
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    db = getDatabase(app);
    auth = getAuth(app);

    // Initialize Analytics if supported in this environment
    if (typeof window !== 'undefined' && config.measurementId) {
      try {
        getAnalytics(app);
      } catch (analyticsError) {
        console.warn("Firebase Analytics could not be initialized:", analyticsError);
      }
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
    return () => { };
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

// --- AUTHENTICATION ---

export const getFirebaseAuth = () => auth;

export const registerUser = async (email: string, pass: string, userData: any) => {
  if (!auth || !db) throw new Error("Firebase init edilmedi.");
  const cred = await createUserWithEmailAndPassword(auth, email, pass);

  // Save extra data to Realtime DB under 'users/{uid}'
  await set(ref(db, `users/${cred.user.uid}`), {
    ...userData,
    email,
    role: email === 'admin@mactakip.com' ? 'admin' : 'user',
    createdAt: new Date().toISOString()
  });

  return cred.user;
};

export const loginUser = async (identifier: string, pass: string) => {
  if (!auth || !db) throw new Error("Firebase init edilmedi.");

  let email = identifier;

  // If identifier is NOT an email, look it up by username
  if (!identifier.includes('@')) {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('username'), equalTo(identifier));
    const snapshot = await get(q);

    if (snapshot.exists()) {
      // Get the first matching user
      const userId = Object.keys(snapshot.val())[0];
      email = snapshot.val()[userId].email;
    } else {
      throw new Error("Kullanıcı bulunamadı.");
    }
  }

  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const getUserProfile = async (uid: string) => {
  if (!db) return null;
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.val();
};

export const listenToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => { };
  return onAuthStateChanged(auth, callback);
};
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';
import { MatchDetails } from '../types';

let db: firebase.database.Database | null = null;
let auth: firebase.auth.Auth | null = null;

export const initFirebase = (config: any) => {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    db = firebase.database();
    auth = firebase.auth();

    // Initialize Analytics if supported in this environment
    if (typeof window !== 'undefined' && config.measurementId) {
      try {
        firebase.analytics();
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

  const matchesRef = db.ref('matches');

  const listener = matchesRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Data might be an object or array depending on how Apps Script pushed it
      // Standardize to array
      const matchesArray = Array.isArray(data) ? data : Object.values(data);
      onData(matchesArray as MatchDetails[]);
    } else {
      onData([]);
    }
  }, (error: any) => {
    onError(error.message);
  });

  // Return cleanup function
  return () => matchesRef.off('value', listener);
};

// --- AUTHENTICATION FUNCTIONS ---

export const getFirebaseAuth = () => auth;

export const registerUser = async (email: string, password: string, firstName: string, lastName: string) => {
  if (!auth || !db) throw new Error("Firebase servisleri başlatılamadı.");

  // 1. Create Auth User
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (user) {
    // 2. Update Auth Profile
    const fullName = `${firstName} ${lastName}`.trim();
    await user.updateProfile({
      displayName: fullName
    });

    // 3. Send verification email
    await user.sendEmailVerification();

    // ADMIN CHECK: If email is the specific admin email, auto-approve and set role
    const isAdminEmail = email.toLowerCase() === 'admin@mactakip.com';

    // 4. Create User Record in Database
    await db.ref('users/' + user.uid).set({
      firstName: firstName,
      lastName: lastName,
      email: email,
      role: isAdminEmail ? 'admin' : 'user',
      isApproved: isAdminEmail ? true : false, // Admins auto-approved, others wait
      createdAt: new Date().toISOString()
    });
  }

  return user;
};

export const loginUser = async (email: string, password: string) => {
  if (!auth || !db) throw new Error("Firebase servisleri başlatılamadı.");

  // 1. Perform Auth Login
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;

  if (user) {
    // 2. Check Database for Approval Status
    const userRef = db.ref('users/' + user.uid);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      const userData = snapshot.val();

      // Check if account is approved
      if (userData.isApproved !== true) {
        // Force logout immediately
        await auth.signOut();
        throw new Error("ACCOUNT_PENDING_APPROVAL");
      }
    } else {
      // If database record is missing (deleted by admin), deny access
      await auth.signOut();
      throw new Error("Kullanıcı kaydı bulunamadı veya silinmiş.");
    }
  }

  return user;
};

export const logoutUser = async () => {
  if (!auth) return;
  await auth.signOut();
};

export const subscribeToAuthChanges = (callback: (user: firebase.User | null) => void) => {
  if (!auth) return () => { };
  return auth.onAuthStateChanged(callback);
};

// --- USER MANAGEMENT (ADMIN) ---

export const getAllUsers = async () => {
  if (!db) throw new Error("Veritabanı bağlantısı yok.");
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');
  if (snapshot.exists()) {
    const data = snapshot.val();
    // Convert object to array and include UID
    return Object.keys(data).map(key => ({
      uid: key,
      ...data[key]
    }));
  }
  return [];
};

export const deleteUser = async (uid: string) => {
  if (!db) throw new Error("Veritabanı bağlantısı yok.");
  // Removing from Realtime DB effectively bans them from logging in 
  // because loginUser checks for DB record existence and approval.
  await db.ref('users/' + uid).remove();
};
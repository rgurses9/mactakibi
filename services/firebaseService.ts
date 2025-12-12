import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database, set, get, remove } from 'firebase/database';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  sendEmailVerification,
  User,
  Auth
} from "firebase/auth";
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

// --- AUTHENTICATION FUNCTIONS ---

export const getFirebaseAuth = () => auth;

export const registerUser = async (email: string, password: string, firstName: string, lastName: string) => {
  if (!auth || !db) throw new Error("Firebase servisleri başlatılamadı.");
  
  // 1. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Update Auth Profile
  const fullName = `${firstName} ${lastName}`.trim();
  await updateProfile(user, {
    displayName: fullName
  });

  // 3. Send verification email
  await sendEmailVerification(user);

  // ADMIN CHECK: If email is the specific admin email, auto-approve and set role
  const isAdminEmail = email.toLowerCase() === 'admin@mactakip.com';

  // 4. Create User Record in Database
  await set(ref(db, 'users/' + user.uid), {
    firstName: firstName,
    lastName: lastName,
    email: email,
    role: isAdminEmail ? 'admin' : 'user',
    isApproved: isAdminEmail ? true : false, // Admins auto-approved, others wait
    createdAt: new Date().toISOString()
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  if (!auth || !db) throw new Error("Firebase servisleri başlatılamadı.");
  
  // 1. Perform Auth Login
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Check Database for Approval Status
  const userRef = ref(db, 'users/' + user.uid);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    
    // Check if account is approved
    if (userData.isApproved !== true) {
      // Force logout immediately
      await signOut(auth);
      throw new Error("ACCOUNT_PENDING_APPROVAL");
    }
  } else {
    // If database record is missing (deleted by admin), deny access
    await signOut(auth);
    throw new Error("Kullanıcı kaydı bulunamadı veya silinmiş.");
  }

  return user;
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// --- USER MANAGEMENT (ADMIN) ---

export const getAllUsers = async () => {
  if (!db) throw new Error("Veritabanı bağlantısı yok.");
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
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
  await remove(ref(db, 'users/' + uid));
};
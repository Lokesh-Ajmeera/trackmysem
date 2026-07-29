import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged as fbOnAuthStateChanged, 
  signOut as fbSignOut, 
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword, 
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser as fbDeleteUser,
  fetchSignInMethodsForEmail as fbFetchSignInMethodsForEmail,
  updatePassword as fbUpdatePassword
} from "firebase/auth";
import { 
  getFirestore, 
  doc as fbDoc, 
  getDoc as fbGetDoc, 
  setDoc as fbSetDoc,
  collection as fbCollection,
  query as fbQuery,
  where as fbWhere,
  getDocs as fbGetDocs
} from "firebase/firestore";

// Helper to safely load/save objects in localStorage
const loadLocal = (key: string, defaultValue: any) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveLocal = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage write key failed:", key, e);
  }
};

const metaEnv = (import.meta as any).env || {};

// User provided Firebase SDK configuration for iiitt-portal
const firebaseConfig = {
  apiKey: "AIzaSyBYxuuh-9bZ69zKlzjLt6Cd6Sdh95qJ6lo",
  authDomain: "iiitt-portal.firebaseapp.com",
  projectId: "iiitt-portal",
  storageBucket: "iiitt-portal.firebasestorage.app",
  messagingSenderId: "357720513053",
  appId: "1:357720513053:web:a7a5ce35a3bc4cfe8e44f4"
};

const isRealFirebase = true;

let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;

if (isRealFirebase) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    console.log("🔥 Firebase initialized successfully with cloud project:", firebaseConfig.projectId);
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
}

// Global subscribers for Mock Auth State changes
type AuthStateCallback = (user: { uid: string; email: string } | null) => void;
const mockAuthSubscribers: Set<AuthStateCallback> = new Set();
let currentUid = localStorage.getItem('iiitt_current_uid') || null;

export const auth = isRealFirebase ? firebaseAuth : {
  get currentUser() {
    if (!currentUid) return null;
    const users = loadLocal('iiitt_users', {});
    const user = Object.values(users).find((u: any) => u.uid === currentUid) as any;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerData: []
      };
    }
    return null;
  }
};

export const db = isRealFirebase ? firebaseDb : {};

// Notify auth state listeners (Mock mode)
const notifyMockAuthState = () => {
  if (isRealFirebase) return;
  const users = loadLocal('iiitt_users', {});
  const user = currentUid ? Object.values(users).find((u: any) => u.uid === currentUid) as any : null;
  const current = user ? { uid: user.uid, email: user.email } : null;
  mockAuthSubscribers.forEach(cb => cb(current));
};

export function onAuthStateChanged(_auth: any, callback: AuthStateCallback) {
  if (isRealFirebase) {
    return fbOnAuthStateChanged(auth, callback);
  } else {
    mockAuthSubscribers.add(callback);
    // Trigger initially
    const users = loadLocal('iiitt_users', {});
    const user = currentUid ? Object.values(users).find((u: any) => u.uid === currentUid) as any : null;
    callback(user ? { uid: user.uid, email: user.email } : null);
    return () => {
      mockAuthSubscribers.delete(callback);
    };
  }
}

export async function signInWithEmailAndPassword(_auth: any, email: string, password?: string) {
  if (isRealFirebase) {
    const emailNorm = email.toLowerCase().trim();
    const cleanPassword = password || "";
    try {
      return await fbSignInWithEmailAndPassword(auth, emailNorm, cleanPassword);
    } catch (authError: any) {
      try {
        const q = fbQuery(fbCollection(db, 'users'), fbWhere('email', '==', emailNorm));
        const qSnap = await fbGetDocs(q);
        if (!qSnap.empty) {
          const userData = qSnap.docs[0].data();
          const storedCustomPass = userData.customPassword || userData.password || "";
          
          if (storedCustomPass && storedCustomPass === cleanPassword) {
            const derivedUniquePassword = `iiitt-otp-auth-${emailNorm.replace(/[^a-z0-9]/g, '')}`;
            
            // Build a comprehensive list of candidate fallback passwords to try
            const candidates = Array.from(new Set([
              derivedUniquePassword,
              "password",
              emailNorm.split("@")[0],
              userData.rollNo || ""
            ].filter(p => typeof p === 'string' && p.trim().length >= 6)));

            for (const candidate of candidates) {
              try {
                const fallbackCreds = await fbSignInWithEmailAndPassword(auth, emailNorm, candidate);
                if (auth.currentUser) {
                  try {
                    await fbUpdatePassword(auth.currentUser, cleanPassword);
                    console.log(`✓ Successfully synchronized Firebase Auth credentials to customized password using candidate: ${candidate}`);
                  } catch (updatePassErr) {
                    console.warn("Could not sync FirebaseAuth password, bypassing (login active):", updatePassErr);
                  }
                }
                return fallbackCreds;
              } catch (candidateErr) {
                // Try next candidate
              }
            }

            // If none of the candidates match, try to create the account directly with the clean password
            try {
              const newCreds = await fbCreateUserWithEmailAndPassword(auth, emailNorm, cleanPassword);
              console.log("✓ Created missing FirebaseAuth user with clean password directly.");
              return newCreds;
            } catch (createErr: any) {
              const cCode = createErr?.code || "";
              const cMsg = String(createErr?.message || "").toLowerCase();
              if (cCode === 'auth/email-already-in-use' || cMsg.includes('email-already-in-use')) {
                console.log("✓ User already exists in FirebaseAuth but none of the candidates matched.");
              }
            }
          }
        }
      } catch (innerErr) {
        console.warn("Firestore customPassword credentials evaluation bypassed:", innerErr);
      }
      throw authError;
    }
  } else {
    const users = loadLocal('iiitt_users', {});
    const emailNorm = email.toLowerCase().trim();
    const user = users[emailNorm];
    
    if (!user) {
      throw new Error("auth/user-not-found: Incorrect email or record does not exist.");
    }
    if (password && user.password !== password) {
      throw new Error("auth/wrong-password: The PIN or password matches did not compile. Try again.");
    }
    
    currentUid = user.uid;
    localStorage.setItem('iiitt_current_uid', currentUid);
    notifyMockAuthState();
    
    return {
      user: {
        uid: user.uid,
        email: user.email
      }
    };
  }
}

export async function signInWithGoogle() {
  if (isRealFirebase) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  } else {
    const emailNorm = "google-user@example.com";
    const users = loadLocal('iiitt_users', {});
    let user = Object.values(users).find((u: any) => u.email === emailNorm) as any;
    if (!user) {
      const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
      user = {
        uid,
        email: emailNorm,
        name: "Google Student User",
      };
      users[emailNorm] = user;
      saveLocal('iiitt_users', users);
    }
    currentUid = user.uid;
    localStorage.setItem('iiitt_current_uid', currentUid);
    notifyMockAuthState();
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.name
      }
    };
  }
}

export async function createUserWithEmailAndPassword(_auth: any, email: string, password?: string) {
  if (isRealFirebase) {
    return fbCreateUserWithEmailAndPassword(auth, email, password || "");
  } else {
    const users = loadLocal('iiitt_users', {});
    const emailNorm = email.toLowerCase().trim();
    
    if (users[emailNorm]) {
      throw { code: 'auth/email-already-in-use', message: 'The email address is already in use.' };
    }
    
    const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid,
      email: emailNorm,
      password
    };
    
    users[emailNorm] = newUser;
    saveLocal('iiitt_users', users);
    
    currentUid = uid;
    localStorage.setItem('iiitt_current_uid', currentUid);
    notifyMockAuthState();
    
    return {
      user: {
        uid,
        email: emailNorm
      }
    };
  }
}

export async function signOut(_auth: any) {
  if (isRealFirebase) {
    return fbSignOut(auth);
  } else {
    currentUid = null;
    localStorage.removeItem('iiitt_current_uid');
    notifyMockAuthState();
  }
}

export async function sendPasswordResetEmail(_auth: any, email: string) {
  if (isRealFirebase) {
    return fbSendPasswordResetEmail(auth, email);
  } else {
    console.log("Mock password reset email sent to:", email);
    return true;
  }
}

export function doc(_db: any, collection: string, id: string) {
  if (isRealFirebase) {
    return fbDoc(db, collection, id);
  } else {
    return { collection, id };
  }
}

export async function getDoc(docRef: any) {
  if (isRealFirebase) {
    try {
      return await fbGetDoc(docRef);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docRef?.path || null);
    }
  } else {
    if (docRef.collection !== 'users') {
      return { exists: () => false, data: () => null };
    }
    const key = `iiitt_user_data_${docRef.id}`;
    const data = loadLocal(key, null);
    return {
      exists: () => data !== null,
      data: () => data
    };
  }
}

export async function setDoc(docRef: any, data: any) {
  if (isRealFirebase) {
    try {
      return await fbSetDoc(docRef, data);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docRef?.path || null);
    }
  } else {
    if (docRef.collection === 'users') {
      const key = `iiitt_user_data_${docRef.id}`;
      saveLocal(key, data);
      
      const users = loadLocal('iiitt_users', {});
      const targetUser = Object.values(users).find((u: any) => u.uid === docRef.id) as any;
      if (targetUser) {
        if (data.name) targetUser.name = data.name;
        if (data.rollNo) targetUser.rollNo = data.rollNo;
        if (data.branch) targetUser.branch = data.branch;
        users[targetUser.email] = targetUser;
        saveLocal('iiitt_users', users);
      }
    }
    return true;
  }
}

// Error diagnostic types and helpers
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth?.currentUser?.uid || null,
      email: firebaseAuth?.currentUser?.email || null,
      emailVerified: firebaseAuth?.currentUser?.emailVerified || false,
      isAnonymous: firebaseAuth?.currentUser?.isAnonymous || false,
      tenantId: firebaseAuth?.currentUser?.tenantId || null,
      providerInfo: firebaseAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function checkIfEmailExists(email: string): Promise<boolean> {
  const emailNorm = email.toLowerCase().trim();
  if (isRealFirebase) {
    try {
      // 1. Try Firestore first & Auto-seed active developer testing accounts
      try {
        const q = fbQuery(fbCollection(db, 'users'), fbWhere('email', '==', emailNorm));
        const qSnap = await fbGetDocs(q);
        if (!qSnap.empty) {
          return true;
        } else {
          // Dynamic auto-provisioning for testing/developer emails
          if (emailNorm === 'lokeshhajmeera@gmail.com' || emailNorm === 'lokeshhajmeera@iiitt.ac.in') {
            console.log("Auto-seeding developer profile during check for existence in Cloud:", emailNorm);
            const docId = `dev_user_${emailNorm.replace(/[^a-z0-9]/g, '_')}`;
            const devDocRef = fbDoc(db, 'users', docId);
            await fbSetDoc(devDocRef, {
              uid: docId,
              name: "Lokesh Hajmeera",
              rollNo: "2111054",
              email: emailNorm,
              branch: "CSE",
              semester: 0,
              year: "",
              phoneNumber: "",
              section: "",
              batch: "",
              gpa: 0.0,
              password: "AJMEERALOKESH@1979",
              customPassword: "AJMEERALOKESH@1979",
              avatarUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23f9fafb'/><circle cx='50' cy='37' r='18' fill='%239ca3af'/><path d='M50 59c-15 0-27 9-27 20v4h54v-4c0-11-12-20-27-20z' fill='%239ca3af'/></svg>",
              subjects: [],
              timetable: [],
              notifications: [],
              logs: []
            });
            return true;
          }
        }
      } catch (dbErr: any) {
        console.warn("Firestore email query notice (switching to non-destructive checks):", dbErr);
        if (dbErr?.message?.toLowerCase().includes("permission") || dbErr?.code === "permission-denied" || dbErr?.name === "FirebaseError") {
          handleFirestoreError(dbErr, OperationType.LIST, 'users');
        }
      }

      // 2. Try non-disruptive fetchSignInMethodsForEmail API
      try {
        const methods = await fbFetchSignInMethodsForEmail(auth, emailNorm);
        if (methods && methods.length > 0) {
          return true;
        }
      } catch (fetchErr: any) {
        console.log("fetchSignInMethodsForEmail notice:", fetchErr?.code || fetchErr?.message);
      }

      // 3. Fallback: Check via dummy credentials attempt to read the error code
      try {
        const dummyPassword = "TempCheckPassword987!@#";
        await fbSignInWithEmailAndPassword(auth, emailNorm, dummyPassword);
        // If it somehow succeeds, it means they logged in with this weak dummy password, so they exist!
        return true;
      } catch (authErr: any) {
        const code = authErr?.code || "";
        const msg = String(authErr?.message || "").toLowerCase();
        
        if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
          // If Firestore seeded them, they exist. Otherwise they don't.
          return false;
        }
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
          return true; // Password was incorrect or credentials invalid, meaning the email exists!
        }
        
        throw authErr;
      }
    } catch (err: any) {
      console.warn("Auth existence diagnostic result:", err);
      return false;
    }
  } else {
    const users = loadLocal('iiitt_users', {});
    if (emailNorm === 'lokeshhajmeera@gmail.com' || emailNorm === 'lokeshhajmeera@iiitt.ac.in') {
      if (!users[emailNorm]) {
        const uid = 'usr_lokesh_dev';
        users[emailNorm] = {
          uid,
          email: emailNorm,
          password: "AJMEERALOKESH@1979",
          name: "Lokesh Hajmeera",
          rollNo: "2111054"
        };
        saveLocal('iiitt_users', users);
        
        const key = `iiitt_user_data_${uid}`;
        saveLocal(key, {
          uid,
          name: "Lokesh Hajmeera",
          rollNo: "2111054",
          email: emailNorm,
          branch: "CSE",
          semester: 0,
          year: "",
          phoneNumber: "",
          section: "",
          batch: "",
          gpa: 0.0,
          subjects: [],
          timetable: [],
          notifications: [],
          logs: []
        });
      }
      return true;
    }
    return !!users[emailNorm];
  }
}

export async function saveOTPInDatabase(email: string, passcode: string, expiresAt: Date): Promise<boolean> {
  const emailNorm = email.toLowerCase().trim();
  if (isRealFirebase) {
    try {
      const otpDocRef = fbDoc(db, 'otps', emailNorm);
      await fbSetDoc(otpDocRef, {
        email: emailNorm,
        passcode: passcode,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (err: any) {
      console.error("Failed to store OTP in Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, 'otps/' + emailNorm);
      throw err;
    }
  } else {
    const otps = loadLocal('iiitt_otps', {});
    otps[emailNorm] = {
      email: emailNorm,
      passcode: passcode,
      expiresAt: expiresAt.getTime(),
      createdAt: Date.now()
    };
    saveLocal('iiitt_otps', otps);
    return true;
  }
}

export async function verifyAndResetPassword(email: string, otpInput: string, newPassword?: string): Promise<boolean> {
  const emailNorm = email.toLowerCase().trim();
  const rawOtpInput = otpInput.trim();
  
  if (isRealFirebase) {
    try {
      const otpDocRef = fbDoc(db, 'otps', emailNorm);
      const snap = await fbGetDoc(otpDocRef);
      if (!snap.exists()) {
        throw new Error("No reset passcode request found for this email address. Please request a new OTP code first.");
      }
      
      const data = snap.data();
      const storedOTP = String(data.passcode || "").trim();
      const expiresAt = data.expiresAt;
      
      if (!storedOTP || storedOTP !== rawOtpInput) {
        throw new Error("The entered verification code is incorrect.");
      }
      
      let isExpired = false;
      if (expiresAt) {
        const expiresTime = typeof expiresAt.toMillis === 'function' ? expiresAt.toMillis() : new Date(expiresAt).getTime();
        if (Date.now() > expiresTime) {
          isExpired = true;
        }
      }
      
      if (isExpired) {
        throw new Error("This verification code has expired. Please request a new OTP.");
      }
      
      const q = fbQuery(fbCollection(db, 'users'), fbWhere('email', '==', emailNorm));
      const querySnapshot = await fbGetDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("No student record profile found for this email in our database.");
      }
      
      const userDoc = querySnapshot.docs[0];
      const userRef = userDoc.ref;
      const userData = userDoc.data();
      
      // Try to update/synchronize Firebase Auth password before writing to Firestore
      if (newPassword) {
        const oldPassword = userData.password || userData.customPassword || "";
        const derivedUniquePassword = `iiitt-otp-auth-${emailNorm.replace(/[^a-z0-9]/g, '')}`;
        
        // Build a unique deduplicated array of potential currently configured passwords
        const candidates = Array.from(new Set([
          oldPassword,
          "password",
          derivedUniquePassword,
          emailNorm.split("@")[0],
          userData.rollNo || ""
        ].filter(p => typeof p === 'string' && p.trim().length >= 6)));

        let authUpdated = false;

        for (const candidate of candidates) {
          try {
            await fbSignInWithEmailAndPassword(auth, emailNorm, candidate);
            if (auth.currentUser) {
              await fbUpdatePassword(auth.currentUser, newPassword);
              console.log(`✓ Successfully updated Firebase Auth password to new password using credentials/candidate: ${candidate}`);
              authUpdated = true;
              break;
            }
          } catch (authUpdateErr) {
            // Keep trying remaining candidates
          }
        }

        // If still not updated, directly try to create the user with the new password
        if (!authUpdated) {
          try {
            await fbCreateUserWithEmailAndPassword(auth, emailNorm, newPassword);
            console.log("✓ Successfully created missing Firebase Auth user with the new password directly.");
            authUpdated = true;
          } catch (createErr: any) {
            const cCode = createErr?.code || "";
            const cMsg = String(createErr?.message || "").toLowerCase();
            if (cCode === 'auth/email-already-in-use' || cMsg.includes('email-already-in-use')) {
              console.log("✓ User already exists in FirebaseAuth. Relying on login sync fallback.");
            } else {
              console.warn("Failed to create user during reset fallback:", createErr);
            }
          }
        }

        // Always sign out to clear standard auth session
        try {
          await fbSignOut(auth);
        } catch (signOutErr) {
          console.warn("SignOut error after reset:", signOutErr);
        }
      }

      await fbSetDoc(userRef, {
        ...userData,
        customPassword: newPassword,
        password: newPassword
      }, { merge: true });
      
      try {
        await fbSetDoc(otpDocRef, { passcode: "", expiresAt: null }, { merge: true });
      } catch (delErr) {
        console.warn("Failed to clean up verified OTP record:", delErr);
      }
      
      return true;
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes("permission") || err?.code === "permission-denied" || err?.name === "FirebaseError") {
        handleFirestoreError(err, OperationType.WRITE, 'users');
      }
      throw err;
    }
  } else {
    const otps = loadLocal('iiitt_otps', {});
    const record = otps[emailNorm];
    if (!record) {
      throw new Error("No reset passcode request found for this email address. Please request a new OTP.");
    }
    
    if (record.passcode !== rawOtpInput) {
      throw new Error("The entered verification code is incorrect.");
    }
    
    if (Date.now() > record.expiresAt) {
      throw new Error("This verification code has expired. Please request a new OTP.");
    }
    
    const users = loadLocal('iiitt_users', {});
    const user = users[emailNorm];
    if (!user) {
      throw new Error("No student record profile found for this email in our database.");
    }
    
    user.password = newPassword;
    users[emailNorm] = user;
    saveLocal('iiitt_users', users);
    
    const key = `iiitt_user_data_${user.uid}`;
    const data = loadLocal(key, null);
    if (data) {
      data.password = newPassword;
      data.customPassword = newPassword;
      saveLocal(key, data);
    }
    
    delete otps[emailNorm];
    saveLocal('iiitt_otps', otps);
    return true;
  }
}

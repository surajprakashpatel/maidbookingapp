'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { UserRole, User, ApprovalStatus } from './types';
import { TEST_CUSTOMER, TEST_MAID } from './mockData';
import { cleanFirestoreData } from './utils';

// ============================================================
// DESIGNATED TEST ACCOUNTS (ONLY 2 ALLOWED FOR TESTING)
// ============================================================

const TEST_ACCOUNTS: Record<string, User> = {
  customer: {
    id: TEST_CUSTOMER.id,
    role: 'customer',
    name: TEST_CUSTOMER.name,
    phone: TEST_CUSTOMER.phone,
    email: TEST_CUSTOMER.email,
    location: TEST_CUSTOMER.location,
    city: TEST_CUSTOMER.city || 'Bhilai',
    area: TEST_CUSTOMER.area,
    address: TEST_CUSTOMER.address,
    status: 'active',
    profileCompleted: true,
    createdAt: TEST_CUSTOMER.createdAt,
  },
  maid: {
    id: TEST_MAID.id,
    role: 'maid',
    name: TEST_MAID.name,
    phone: TEST_MAID.phone,
    email: TEST_MAID.email,
    location: TEST_MAID.location,
    city: TEST_MAID.city || 'Bhilai',
    area: TEST_MAID.area,
    address: TEST_MAID.address,
    status: 'active',
    profileCompleted: true,
    createdAt: TEST_MAID.createdAt,
  },
};

const STORAGE_KEY = 'maideasy_user_session';

export function isProfileComplete(u: Partial<User> | null | undefined): boolean {
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.profileCompleted === false) return false;

  const hasValidName = !!u.name && u.name.trim().length >= 2 && !u.name.startsWith('User ') && u.name !== 'Google User';
  if (!hasValidName) return false;

  const digits = (u.phone || '').replace(/\D/g, '');
  const hasValidPhone = digits.length === 10;
  if (!hasValidPhone) return false;

  const hasValidRole = u.role === 'customer' || u.role === 'maid';
  if (!hasValidRole) return false;

  const hasValidCity = !!(u.city || u.location);
  if (!hasValidCity) return false;

  const hasValidArea = !!u.area && u.area.trim().length > 0;
  if (!hasValidArea) return false;

  if (u.role === 'customer') {
    const hasValidAddress = !!u.address && u.address.trim().length >= 5;
    if (!hasValidAddress) return false;
  }

  if (u.role === 'maid' && u.profileCompleted !== true) {
    return false;
  }

  return true;
}

interface AuthResult {
  success: boolean;
  isNewUser?: boolean;
  role?: UserRole;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (role: UserRole, emailOrPhone: string, password?: string) => Promise<AuthResult>;
  adminLogin: (emailOrPhone: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (role: UserRole) => Promise<AuthResult>;
  logout: () => void;
  signup: (role: UserRole, name: string, phone: string, password?: string, additionalData?: Partial<User>) => Promise<AuthResult>;
  updateUser: (updates: Partial<User>) => void;
  completeProfile: (profileData: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatSyntheticEmail(phoneOrEmail: string): string {
  if (phoneOrEmail.includes('@')) return phoneOrEmail.trim().toLowerCase();
  const digits = phoneOrEmail.replace(/\D/g, '');
  return `user_${digits}@maideasy.in`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const saveUserSession = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && mounted) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      // Ignore parse errors
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!mounted) return;
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as User;
            let approvalStatus = data.approvalStatus;
            let rejectionReason = data.rejectionReason;

            // If maid, check maid doc for approvalStatus sync
            if (data.role === 'maid') {
              const maidSnap = await getDoc(doc(db, 'maids', `maid-${fbUser.uid}`)).catch(() => null);
              if (maidSnap && maidSnap.exists()) {
                const mData = maidSnap.data();
                if (mData.approvalStatus) approvalStatus = mData.approvalStatus;
                if (mData.rejectionReason) rejectionReason = mData.rejectionReason;
              }
            }

            const complete = isProfileComplete(data);
            // Customers are automatically approved once complete/active; Maids and legacy users check approvalStatus
            if (data.role === 'customer') {
              approvalStatus = 'approved';
            } else if (!approvalStatus) {
              approvalStatus = (data.role === 'admin' || (data.status === 'active' && complete)) ? 'approved' : 'pending';
            }

            const verifiedUser: User = {
              ...data,
              id: fbUser.uid,
              role: data.role || 'customer',
              approvalStatus,
              rejectionReason,
              profileCompleted: complete,
            };
            saveUserSession(verifiedUser);
          } else {
            const isEmailAdmin = fbUser.email === 'admin@maideasy.in' || fbUser.email === 'admin@maidbookingapp.com';
            if (isEmailAdmin) {
              const adminUser: User = {
                id: fbUser.uid,
                role: 'admin',
                name: 'Platform Administrator',
                email: fbUser.email || 'admin@maideasy.in',
                phone: '9000000001',
                status: 'active',
                approvalStatus: 'approved',
                profileCompleted: true,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, cleanFirestoreData(adminUser), { merge: true });
              saveUserSession(adminUser);
            } else {
              // Authenticated user whose profile doc is not yet created: create draft
              const pendingUser: User = {
                id: fbUser.uid,
                role: 'customer',
                name: fbUser.displayName || '',
                phone: fbUser.phoneNumber || '',
                email: fbUser.email || undefined,
                photoUrl: fbUser.photoURL || undefined,
                status: 'active',
                approvalStatus: 'approved',
                profileCompleted: false,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, cleanFirestoreData(pendingUser), { merge: true });
              saveUserSession(pendingUser);
            }
          }
        } catch (err) {
          console.warn('Error syncing auth state from Firestore:', err);
        }
      } else {
        saveUserSession(null);
      }
      setIsInitializing(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [saveUserSession]);

  const login = useCallback(async (
    role: UserRole,
    emailOrPhone: string,
    password?: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const email = formatSyntheticEmail(emailOrPhone);
    const pass = password || 'Password123!';

    try {
      let uid: string;

      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        uid = cred.user.uid;
      } catch (authErr: unknown) {
        const errCode = (authErr as { code?: string })?.code;
        if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
          const newCred = await createUserWithEmailAndPassword(auth, email, pass);
          uid = newCred.user.uid;
        } else {
          throw authErr;
        }
      }

      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as User;
        let approvalStatus = data.approvalStatus;
        let rejectionReason = data.rejectionReason;

        // If maid, also check maid doc for most up-to-date approval status
        if ((data.role === 'maid' || role === 'maid')) {
          const maidSnap = await getDoc(doc(db, 'maids', `maid-${uid}`)).catch(() => null);
          if (maidSnap && maidSnap.exists()) {
            const mData = maidSnap.data();
            if (mData.approvalStatus) approvalStatus = mData.approvalStatus;
            if (mData.rejectionReason) rejectionReason = mData.rejectionReason;
          }
        }

        // Fallback for pre-existing active users: treat as approved
        if (data.role === 'customer' || role === 'customer') {
          approvalStatus = 'approved';
        } else if (!approvalStatus) {
          approvalStatus = (data.role === 'admin' || data.status === 'active') ? 'approved' : 'pending';
        }

        const complete = isProfileComplete(data);
        const resolvedUser: User = {
          ...data,
          id: uid,
          role: data.role || role,
          approvalStatus,
          rejectionReason,
          profileCompleted: complete,
        };
        saveUserSession(resolvedUser);
        setIsLoading(false);
        return {
          success: true,
          isNewUser: !complete,
          role: resolvedUser.role,
          approvalStatus,
          rejectionReason,
        };
      } else {
        const pendingUser: User = {
          id: uid,
          role,
          name: '',
          phone: emailOrPhone.includes('@') ? '' : emailOrPhone,
          email: email.includes('@maideasy.in') ? undefined : email,
          status: 'active',
          approvalStatus: role === 'customer' ? 'approved' : 'pending',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        saveUserSession(pendingUser);
        setIsLoading(false);
        return { success: true, isNewUser: true, role, approvalStatus: role === 'customer' ? 'approved' : 'pending' };
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Invalid credentials or login failure.' };
    }
  }, [saveUserSession]);

  const adminLogin = useCallback(async (
    emailOrPhone: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const email = formatSyntheticEmail(emailOrPhone);

    try {
      let uid: string;
      const isAuthorizedAdminEmail = email === 'admin@maideasy.in' || email === 'admin@maidbookingapp.com';

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      } catch (authErr: unknown) {
        const errCode = (authErr as { code?: string })?.code;
        if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
          if (isAuthorizedAdminEmail) {
            const newCred = await createUserWithEmailAndPassword(auth, email, password || 'admin123');
            uid = newCred.user.uid;
          } else {
            setIsLoading(false);
            return { success: false, error: 'Invalid credentials or user not found.' };
          }
        } else {
          throw authErr;
        }
      }

      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      let adminUser: User;

      if (snap.exists()) {
        const data = snap.data() as User;
        if (data.role !== 'admin' && !isAuthorizedAdminEmail) {
          await signOut(auth);
          setIsLoading(false);
          return { success: false, error: 'Access Denied: You do not have administrator permissions.' };
        }

        adminUser = {
          ...data,
          id: uid,
          role: 'admin',
          profileCompleted: true,
        };

        if (data.role !== 'admin' && isAuthorizedAdminEmail) {
          await setDoc(userDocRef, cleanFirestoreData(adminUser), { merge: true });
        }
      } else {
        if (!isAuthorizedAdminEmail) {
          await signOut(auth);
          setIsLoading(false);
          return { success: false, error: 'Access Denied: Unrecognized administrator account.' };
        }
        adminUser = {
          id: uid,
          role: 'admin',
          name: 'Platform Administrator',
          email,
          phone: '9000000001',
          status: 'active',
          profileCompleted: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, cleanFirestoreData(adminUser));
      }

      saveUserSession(adminUser);
      setIsLoading(false);
      return { success: true, isNewUser: false, role: 'admin' };
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Admin authentication failed.' };
    }
  }, [saveUserSession]);

  const loginWithGoogle = useCallback(async (
    role: UserRole
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as User;
        let approvalStatus = data.approvalStatus;
        let rejectionReason = data.rejectionReason;

        if (data.role === 'maid' || role === 'maid') {
          const maidSnap = await getDoc(doc(db, 'maids', `maid-${fbUser.uid}`)).catch(() => null);
          if (maidSnap && maidSnap.exists()) {
            const mData = maidSnap.data();
            if (mData.approvalStatus) approvalStatus = mData.approvalStatus;
            if (mData.rejectionReason) rejectionReason = mData.rejectionReason;
          }
        }

        const complete = isProfileComplete(data);
        if (data.role === 'customer' || role === 'customer') {
          approvalStatus = 'approved';
        } else if (!approvalStatus) {
          approvalStatus = (data.role === 'admin' || (data.status === 'active' && complete)) ? 'approved' : 'pending';
        }

        const resolvedUser: User = {
          ...data,
          id: fbUser.uid,
          role: data.role || role,
          approvalStatus,
          rejectionReason,
          profileCompleted: complete,
        };
        saveUserSession(resolvedUser);
        setIsLoading(false);
        return {
          success: true,
          isNewUser: !complete,
          role: resolvedUser.role,
          approvalStatus,
          rejectionReason,
        };
      } else {
        const pendingUser: User = {
          id: fbUser.uid,
          role,
          name: fbUser.displayName || '',
          phone: fbUser.phoneNumber || '',
          email: fbUser.email || undefined,
          photoUrl: fbUser.photoURL || undefined,
          status: 'active',
          approvalStatus: role === 'customer' ? 'approved' : 'pending',
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, cleanFirestoreData(pendingUser), { merge: true });
        saveUserSession(pendingUser);
        setIsLoading(false);
        return { success: true, isNewUser: true, role, approvalStatus: role === 'customer' ? 'approved' : 'pending' };
      }
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Google Sign-In failed.' };
    }
  }, [saveUserSession]);

  const signup = useCallback(async (
    role: UserRole,
    name: string,
    phone: string,
    password?: string,
    additionalData?: Partial<User>
  ): Promise<AuthResult> => {
    setIsLoading(true);
    if (role === 'admin') {
      setIsLoading(false);
      return { success: false, error: 'Admin accounts cannot be created via public signup.' };
    }
    const pass = password || 'Password123!';
    const userEmail = additionalData?.email || formatSyntheticEmail(phone);

    try {
      const cred = await createUserWithEmailAndPassword(auth, userEmail, pass);
      const uid = cred.user.uid;

      const cleanPhoneDigits = (phone || '').replace(/\D/g, '');
      const isComplete = role === 'customer'
        ? !!(
            name && name.trim().length >= 2 &&
            cleanPhoneDigits.length === 10 &&
            (additionalData?.area || additionalData?.location || additionalData?.city) &&
            additionalData?.address && additionalData.address.trim().length >= 5
          )
        : false;

      const newUser: User = {
        id: uid,
        role,
        name,
        phone,
        email: additionalData?.email || (userEmail.includes('@maideasy.in') ? undefined : userEmail),
        location: additionalData?.location || additionalData?.city || 'Bhilai',
        city: additionalData?.city || additionalData?.location || 'Bhilai',
        area: additionalData?.area || '',
        address: additionalData?.address || '',
        status: 'active',
        approvalStatus: role === 'customer' ? 'approved' : 'pending',
        profileCompleted: isComplete,
        createdAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, cleanFirestoreData(newUser), { merge: true });

      if (role === 'customer') {
        const custDocRef = doc(db, 'customers', uid);
        await setDoc(custDocRef, cleanFirestoreData({
          ...newUser,
          totalBookings: 0,
        }), { merge: true }).catch(() => {});
      }

      // Dispatch admin notification for approval request ONLY for Maid applications
      if (role === 'maid' && isComplete) {
        try {
          const { notifyAdminsNewRegistration } = await import('./services/notificationService');
          await notifyAdminsNewRegistration({
            id: uid,
            name,
            role,
            phone,
            email: newUser.email,
          });
        } catch (notifErr) {
          console.warn('Failed to dispatch admin notification:', notifErr);
        }
      }

      saveUserSession(newUser);
      setIsLoading(false);
      return { success: true, isNewUser: !isComplete, role, approvalStatus: role === 'customer' ? 'approved' : 'pending' };
    } catch (err: unknown) {
      console.error('Signup error:', err);
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Sign up failed.' };
    }
  }, [saveUserSession]);

  const completeProfile = useCallback(async (
    profileData: Partial<User>
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    try {
      const currentAuthUser = auth.currentUser;
      const targetUid = currentAuthUser?.uid || user?.id;

      if (!targetUid) {
        setIsLoading(false);
        return { success: false, error: 'Authentication session not found. Please log in again.' };
      }

      const { completeUserProfile } = await import('./services/userService');
      const res = await completeUserProfile({
        ...user,
        ...profileData,
        id: targetUid,
        role: (profileData.role || user?.role || 'customer') as UserRole,
        name: profileData.name || user?.name || '',
      });

      if (res.success && res.user) {
        const fullUser: User = {
          ...res.user,
          profileCompleted: true,
        };
        saveUserSession(fullUser);
        setIsLoading(false);
        return { success: true, user: fullUser };
      } else {
        setIsLoading(false);
        return { success: false, error: res.error || 'Failed to complete profile.' };
      }
    } catch (err: unknown) {
      console.error('Profile complete error:', err);
      setIsLoading(false);
      return { success: false, error: (err as Error)?.message || 'Failed to save profile.' };
    }
  }, [user, saveUserSession]);

  const logout = useCallback(() => {
    signOut(auth).catch(() => {});
    saveUserSession(null);
  }, [saveUserSession]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage unavailable
      }
      return updated;
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const testAccount = TEST_ACCOUNTS[role];
    if (testAccount) saveUserSession(testAccount);
  }, [saveUserSession]);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      isInitializing,
      login,
      adminLogin,
      loginWithGoogle,
      logout,
      signup,
      updateUser,
      completeProfile,
      switchRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

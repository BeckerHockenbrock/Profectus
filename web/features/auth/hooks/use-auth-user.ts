"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export function useAuthUser() {
  const isConfigured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null | undefined>(isConfigured ? undefined : null);
  const [authError, setAuthError] = useState(isConfigured ? "" : "Firebase is not configured yet.");

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const auth = getFirebaseAuth();
    const stopAuthListener = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => {
      stopAuthListener();
    };
  }, [isConfigured]);

  const signIn = async () => {
    setAuthError("");
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch {
      setAuthError("Google sign-in did not start. Try again.");
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setAuthError("Could not sign out. Try again.");
    }
  };

  const clearAuthError = () => {
    setAuthError("");
  };

  return {
    user,
    isConfigured,
    authError,
    setAuthError,
    clearAuthError,
    signIn,
    signOut: signOutUser,
  };
}

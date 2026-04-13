import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authBackend } from "./source";
import type { AuthResult, User } from "./types";

export interface AuthContextValue {
  user: User | null;
  /** True until the initial auth state has been hydrated. */
  loading: boolean;

  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;

  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<AuthResult<true>>;
  changeEmail: (newEmail: string, password: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult<true>>;
  markVerified: () => Promise<AuthResult>;
  resetPasswordRequest: (email: string) => Promise<AuthResult<true>>;
  deleteAccount: (password: string) => Promise<AuthResult<true>>;
}

// Exported only so the useAuth hook (in useAuth.ts) can read it.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authBackend.onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // All methods below simply forward to the swap-point. Wrapped in
  // useCallback so consumers can put them in effect deps without churn.
  const signUpWithEmail = useCallback(
    (email: string, password: string) =>
      authBackend.signUpWithEmail(email, password),
    [],
  );
  const signInWithEmail = useCallback(
    (email: string, password: string) =>
      authBackend.signInWithEmail(email, password),
    [],
  );
  const signInWithGoogle = useCallback(
    () => authBackend.signInWithGoogle(),
    [],
  );
  const signOut = useCallback(() => authBackend.signOut(), []);
  const changePassword = useCallback(
    (oldPassword: string, newPassword: string) =>
      authBackend.changePassword(oldPassword, newPassword),
    [],
  );
  const changeEmail = useCallback(
    (newEmail: string, password: string) =>
      authBackend.changeEmail(newEmail, password),
    [],
  );
  const resendVerification = useCallback(
    () => authBackend.resendVerification(),
    [],
  );
  const markVerified = useCallback(() => authBackend.markVerified(), []);
  const resetPasswordRequest = useCallback(
    (email: string) => authBackend.resetPasswordRequest(email),
    [],
  );
  const deleteAccount = useCallback(
    (password: string) => authBackend.deleteAccount(password),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      changePassword,
      changeEmail,
      resendVerification,
      markVerified,
      resetPasswordRequest,
      deleteAccount,
    }),
    [
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      changePassword,
      changeEmail,
      resendVerification,
      markVerified,
      resetPasswordRequest,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

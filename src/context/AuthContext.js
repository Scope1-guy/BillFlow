import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

// Keeps track of who is logged in. Supabase stores the login in the browser for us.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know if someone is logged in

  useEffect(() => {
    // 1) Check for an existing login when the app opens
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2) Listen for logins and logouts from now on
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
      }
    );

    // Cleanup: stop listening when this component goes away
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session ? session.user : null,
    loading,
    signUp: (email, password, firstName, lastName) =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          // Saved with the account as "user metadata"
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      }),
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

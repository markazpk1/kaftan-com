import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check admin role from user metadata
          const isAdminUser = currentUser.user_metadata?.role === 'admin';
          setIsAdmin(isAdminUser);
          console.log('Admin role checked:', isAdminUser);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check admin role from user metadata
          const isAdminUser = currentUser.user_metadata?.role === 'admin';
          setIsAdmin(isAdminUser);
        } else {
          // Check for fallback admin session
          const fallbackSession = localStorage.getItem('admin-session');
          if (fallbackSession) {
            // Try to restore session
            const { data: { session: restoredSession } } = await supabase.auth.getSession();
            if (restoredSession?.user) {
              const isAdminUser = restoredSession.user.user_metadata?.role === 'admin';
              setIsAdmin(isAdminUser);
              setUser(restoredSession.user);
            } else {
              localStorage.removeItem('admin-session');
            }
          }
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signOut };
};

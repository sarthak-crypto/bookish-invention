
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isSuperAdmin: boolean;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      // First check if the user's email is the authorized super admin email
      if (user.email !== 'sarthakparikh20010409@gmail.com') {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Use the security definer function to avoid RLS recursion
        const { data, error } = await supabase
          .rpc('is_user_super_admin', { check_user_id: user.id });

        if (error) {
          console.error('Error checking super admin status:', error);
          setIsSuperAdmin(false);
        } else {
          // User must have both the correct email AND the super_admin role in the database
          setIsSuperAdmin(data === true && user.email === 'sarthakparikh20010409@gmail.com');
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdmin();
  }, [user]);

  return (
    <AdminAuthContext.Provider value={{ isSuperAdmin, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};


import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Crown, User, Palette, RotateCcw, Trash2, Mail, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  email: string;
  client_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_roles: {
    role: string;
  }[] | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // First get all profiles
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          client_name,
          created_at
        `);

      if (error) throw error;

      // Get user roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.warn('Error fetching roles:', rolesError);
      }

      // Create a roles map for quick lookup
      const rolesMap = (rolesData || []).reduce((acc, roleData) => {
        acc[roleData.user_id] = roleData.role;
        return acc;
      }, {} as Record<string, string>);

      // Map profiles with roles and construct user objects
      const usersWithRoles: UserWithRole[] = (profilesData || []).map((profile) => {
        const userRole = rolesMap[profile.id] || 'artist'; // default role
        
        // For demo purposes, we'll use a simple email format
        // In a real app, you'd need to fetch this from auth metadata or store it in profiles
        const email = `user-${profile.id.slice(0, 8)}@example.com`;
        
        return {
          ...profile,
          email,
          last_sign_in_at: null,
          email_confirmed_at: null,
          user_roles: [{ role: userRole }]
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Password reset email sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'artist' | 'super_admin' | 'fan') => {
    try {
      // First, delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getUserRole = (user: UserWithRole): string => {
    return user.user_roles?.[0]?.role || 'artist';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'artist':
        return <Palette className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'artist':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-foreground text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground-dark flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management ({filteredUsers.length} users)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const userRole = getUserRole(user);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    {getRoleIcon(userRole)}
                  </div>
                  <div>
                    <p className="text-foreground-dark font-medium">{user.email}</p>
                    <p className="text-foreground text-sm">
                      {user.client_name || 'No client name'}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                      <span className="text-green-600 font-medium">Admin Dashboard Access</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={getRoleBadgeVariant(userRole)} className="flex items-center gap-1">
                    {getRoleIcon(userRole)}
                    {userRole.replace('_', ' ')}
                  </Badge>

                  <div className="flex gap-2">
                    <Select
                      value={userRole}
                      onValueChange={(newRole: 'artist' | 'super_admin' | 'fan') => updateUserRole(user.id, newRole)}
                    >
                      <SelectTrigger className="w-32 bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artist">Client</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="fan">Fan</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => sendPasswordResetEmail(user.email)}
                      size="sm"
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Password
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found matching your search.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;

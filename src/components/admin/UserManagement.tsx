import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Crown, User, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  email: string;
  artist_name: string | null;
  created_at: string;
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
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          artist_name,
          created_at
        `);

      if (error) throw error;

      // Fetch user emails and roles separately
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profilesData || []).map(async (profile) => {
          try {
            // Get user email from auth metadata
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
            
            // Get user roles
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);

            return {
              ...profile,
              email: authData.user?.email || 'Unknown',
              user_roles: rolesData || []
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
            return {
              ...profile,
              email: 'Unknown',
              user_roles: []
            };
          }
        })
      );

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
    user.artist_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const userRole = getUserRole(user);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    {getRoleIcon(userRole)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-gray-300 text-sm">
                      {user.artist_name || 'No artist name'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={getRoleBadgeVariant(userRole)} className="flex items-center gap-1">
                    {getRoleIcon(userRole)}
                    {userRole.replace('_', ' ')}
                  </Badge>

                  <Select
                    value={userRole}
                    onValueChange={(newRole: 'artist' | 'super_admin' | 'fan') => updateUserRole(user.id, newRole)}
                  >
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="fan">Fan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No users found matching your search.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;

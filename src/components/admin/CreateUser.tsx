
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateUser: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    client_name: '',
    role: 'artist' as 'artist' | 'super_admin' | 'fan'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.client_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user through Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            client_name: formData.client_name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update user role if not default
        if (formData.role !== 'artist') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', data.user.id);

          if (roleError) {
            console.error('Error updating role:', roleError);
          }
        }

        toast({
          title: "Success",
          description: `User created successfully with role: ${formData.role}`,
        });

        // Reset form
        setFormData({
          email: '',
          password: '',
          client_name: '',
          role: 'artist'
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Client Name *
            </Label>
            <Input
              id="client_name"
              type="text"
              placeholder="Enter the client's display name"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'artist' | 'super_admin' | 'fan') => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Client (Default)</SelectItem>
                <SelectItem value="fan">Fan</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Clients can create and manage albums, fans can purchase cards, admins have full access.
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating User...' : 'Create User'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({
                email: '',
                password: '',
                client_name: '',
                role: 'artist'
              })}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUser;

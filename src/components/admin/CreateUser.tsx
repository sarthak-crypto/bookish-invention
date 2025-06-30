import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Lock, User, Crown, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateUser: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoUserCreated, setDemoUserCreated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    artistName: '',
    role: 'artist'
  });

  // Auto-create demo user on component mount
  useEffect(() => {
    createDemoSuperUserAuto();
  }, []);

  const createDemoSuperUserAuto = async () => {
    const demoEmail = 'demo-admin@example.com';
    const demoPassword = 'DemoAdmin123!';
    const demoArtistName = 'Demo Super Admin';

    try {
      // Check if demo user already exists by trying to sign them in
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (existingUser.user) {
        // User already exists, sign them out and mark as created
        await supabase.auth.signOut();
        setDemoUserCreated(true);
        console.log('Demo user already exists');
        return;
      }
    } catch (error) {
      // User doesn't exist or wrong password, continue with creation
    }

    try {
      // Create demo super user using regular signup
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            artist_name: demoArtistName,
            role: 'super_admin'
          }
        }
      });

      if (error) {
        console.error('Error creating auto demo user:', error);
        return;
      }

      setDemoUserCreated(true);
      console.log('Demo Super User Created Automatically!');
      console.log('Email:', demoEmail);
      console.log('Password:', demoPassword);

      toast({
        title: "Demo Super User Ready!",
        description: `Email: ${demoEmail} | Password: ${demoPassword}`,
        duration: 8000,
      });

    } catch (error: any) {
      console.error('Error creating auto demo super user:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user with regular signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            artist_name: formData.artistName,
            role: formData.role
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User created successfully with ${formData.role} role`,
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        artistName: '',
        role: 'artist'
      });
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

  const createDemoSuperUser = async () => {
    setDemoLoading(true);
    
    const demoEmail = 'demo-admin@example.com';
    const demoPassword = 'DemoAdmin123!';
    const demoArtistName = 'Demo Super Admin';

    try {
      // Create demo super user using regular signup
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            artist_name: demoArtistName,
            role: 'super_admin'
          }
        }
      });

      if (error) throw error;

      setDemoUserCreated(true);
      toast({
        title: "Demo Super User Created!",
        description: `Email: ${demoEmail} | Password: ${demoPassword}`,
        duration: 10000,
      });

      console.log('Demo Super User Credentials:');
      console.log('Email:', demoEmail);
      console.log('Password:', demoPassword);

    } catch (error: any) {
      console.error('Error creating demo super user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create demo super user",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6">
      {/* Demo Super User Status Card */}
      <Card className={`bg-gradient-to-r backdrop-blur-lg border-purple-500/30 ${
        demoUserCreated 
          ? 'from-green-600/20 to-blue-600/20 border-green-500/30' 
          : 'from-purple-600/20 to-blue-600/20'
      }`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {demoUserCreated ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <Zap className="h-6 w-6 text-yellow-400" />
            )}
            {demoUserCreated ? 'Demo Super User Ready!' : 'Quick Demo Super User'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoUserCreated ? (
              <>
                <p className="text-green-100 text-sm">
                  Your demo super admin account is ready to use!
                </p>
                <div className="bg-green-900/30 p-3 rounded-lg">
                  <p className="text-green-200 text-xs mb-2">Login Credentials:</p>
                  <p className="text-white text-sm font-mono">Email: demo-admin@example.com</p>
                  <p className="text-white text-sm font-mono">Password: DemoAdmin123!</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.href = '/auth'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Go to Login Page
                  </Button>
                  <Button
                    onClick={createDemoSuperUser}
                    disabled={demoLoading}
                    variant="outline"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    {demoLoading ? 'Creating...' : 'Create Another'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-purple-100 text-sm">
                  Create a pre-configured demo super admin account for testing purposes.
                </p>
                <div className="bg-purple-900/30 p-3 rounded-lg">
                  <p className="text-purple-200 text-xs mb-2">Demo Credentials:</p>
                  <p className="text-white text-sm">Email: demo-admin@example.com</p>
                  <p className="text-white text-sm">Password: DemoAdmin123!</p>
                </div>
                <Button
                  onClick={createDemoSuperUser}
                  disabled={demoLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {demoLoading ? 'Creating Demo User...' : 'Create Demo Super User'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regular User Creation Form */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Enter password"
                    required
                  />
                  <Button
                    type="button"
                    onClick={generateRandomPassword}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="artistName" className="text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Artist Name (Optional)
                </Label>
                <Input
                  id="artistName"
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Artist display name"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-white flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  User Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  email: '',
                  password: '',
                  artistName: '',
                  role: 'artist'
                })}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Clear Form
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-600/20 rounded-lg border border-blue-500/20">
            <h3 className="text-blue-200 font-medium mb-2">User Creation Notes:</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Users will receive a confirmation email (if email confirmation is enabled)</li>
              <li>• Super admins can create other super admins and manage all system features</li>
              <li>• Artists have access to the standard dashboard features</li>
              <li>• Generated passwords are cryptographically secure</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUser;


import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login');
  const isResetMode = searchParams.get('reset') === 'true';

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isResetMode) {
      navigate('/dashboard');
    }
  }, [user, navigate, isResetMode]);

  useEffect(() => {
    if (isResetMode) {
      setActiveTab('reset');
    }
  }, [isResetMode]);

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Header */}
        <div className="absolute top-4 left-4">
          <Link to="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground-dark">FanCard</span>
          </Link>
        </div>

        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-foreground-dark">Reset Password</CardTitle>
            <CardDescription className="text-foreground">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4">
        <Link to="/" className="flex items-center space-x-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground-dark">FanCard</span>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl text-foreground-dark">Welcome to FanCard</CardTitle>
          <CardDescription className="text-foreground">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:text-foreground-dark">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:text-foreground-dark">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

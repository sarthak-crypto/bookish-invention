
import React, { useEffect, useState } from 'react';
import SignUpForm from '@/components/auth/SignUpForm';
import LoginForm from '@/components/auth/LoginForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    // Check if we're in password reset mode
    if (searchParams.get('reset') === 'true') {
      setIsResetMode(true);
    }
  }, [searchParams]);

  if (isResetMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 font-saira" style={{ backgroundColor: '#F4E9C1' }}>
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center text-primary" style={{ color: '#C87343' }}>
            <Music className="h-8 w-8" />
            <span className="ml-2 text-2xl font-bold">ArtisteConnect</span>
          </Link>
        </div>
        <div className="w-full max-w-md p-8 space-y-8 bg-white/80 rounded-xl shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)'}}>
          <ResetPasswordForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 font-saira" style={{ backgroundColor: '#F4E9C1' }}>
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center text-primary" style={{ color: '#C87343' }}>
          <Music className="h-8 w-8" />
          <span className="ml-2 text-2xl font-bold">ArtisteConnect</span>
        </Link>
      </div>
      <div className="w-full max-w-md p-8 space-y-8 bg-white/80 rounded-xl shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)'}}>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-primary/10">
            <TabsTrigger value="login" style={{ color: '#220C10' }} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
            <TabsTrigger value="signup" style={{ color: '#220C10' }} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-6">
            <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#C87343' }}>Welcome Back!</h2>
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#C87343' }}>Join ArtisteConnect</h2>
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
       <p className="mt-8 text-center text-sm" style={{ color: '#220C10' }}>
        By signing up, you agree to our (not yet existing) Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default AuthPage;

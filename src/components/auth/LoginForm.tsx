
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login successful!');
        navigate('/'); // AuthProvider will also handle redirect on SIGNED_IN
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error('Password reset error:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground-dark">Reset Password</h3>
          <p className="text-sm text-foreground/70 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isResetting ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              className="flex-1"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Logging In...' : 'Login'}
        </Button>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;

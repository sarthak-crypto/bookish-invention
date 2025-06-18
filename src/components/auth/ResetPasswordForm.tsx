
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [isValidSession, setIsValidSession] = useState(false);
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if we have a valid session for password reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error('Invalid or expired reset link. Please request a new one.');
        navigate('/auth');
      }
    });
  }, [navigate]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error('Password update error:', error);
    }
  };

  if (!isValidSession) {
    return (
      <div className="text-center">
        <p className="text-foreground/70">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground-dark">Set New Password</h3>
        <p className="text-sm text-foreground/70 mt-2">
          Enter your new password below.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;

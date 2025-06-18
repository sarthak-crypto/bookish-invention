
import React from 'react';
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

const signUpSchema = z.object({
  artistName: z.string().min(2, { message: 'Artist name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      artistName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            artist_name: data.artistName,
          },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Sign up successful! Please check your email to verify your account.');
        // Supabase handles email verification, user will be redirected by AuthProvider on SIGNED_IN if auto-confirm is on
        // Or they will need to click verification link.
        // For now, we assume they will be redirected or will log in after verification.
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error('Sign up error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="artistName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Artist Name" {...field} className="text-foreground-dark bg-background/70 border-primary/50 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          {form.formState.isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, LogOut } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { user, signIn, signUp, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'register');
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        onOpenChange(false);
        resetForm();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created! Please check your email to confirm your registration.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  // User is logged in - show profile
  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-[#8b5cf6]/30">
          <DialogHeader>
            <DialogTitle className="text-white">Profile</DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              Manage your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{user.email}</p>
                <p className="text-[#9ca3af] text-sm">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // User is not logged in - show login/register form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-[#8b5cf6]/30">
        <DialogHeader>
          <DialogTitle className="text-white">Welcome to ImageLingo</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            Sign in or create an account to save your work
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0d0d1a]">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-[#8b5cf6] data-[state=active]:text-white"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-[#8b5cf6] data-[state=active]:text-white"
            >
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-[#9ca3af]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-[#0d0d1a] border-[#8b5cf6]/30 text-white placeholder:text-[#6b7280] focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-[#9ca3af]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-[#0d0d1a] border-[#8b5cf6]/30 text-white placeholder:text-[#6b7280] focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#7c3aed] hover:to-[#a21caf] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-[#9ca3af]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-[#0d0d1a] border-[#8b5cf6]/30 text-white placeholder:text-[#6b7280] focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-[#9ca3af]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-[#0d0d1a] border-[#8b5cf6]/30 text-white placeholder:text-[#6b7280] focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm" className="text-[#9ca3af]">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 bg-[#0d0d1a] border-[#8b5cf6]/30 text-white placeholder:text-[#6b7280] focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {success && (
                <p className="text-green-400 text-sm">{success}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#7c3aed] hover:to-[#a21caf] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

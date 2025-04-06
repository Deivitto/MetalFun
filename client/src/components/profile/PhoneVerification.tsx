import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  initializeRecaptcha, 
  sendVerificationCode, 
  verifyPhoneNumber 
} from '@/lib/firebase';
import { RecaptchaVerifier } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PhoneVerificationProps {
  onSuccess?: () => void;
}

export function PhoneVerification({ onSuccess }: PhoneVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user?.phoneVerified);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // References for Firebase auth
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<any>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Initialize recaptcha when component mounts
  useEffect(() => {
    // Only initialize if not verified and not in code entry mode
    if (!isPhoneVerified && !isCodeSent && recaptchaContainerRef.current) {
      try {
        // Clear any existing recaptcha instances
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }
        
        // Create new recaptcha verifier
        recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
        setError(null);
      } catch (err: any) {
        console.error('Failed to initialize reCAPTCHA:', err);
        setError(`Failed to initialize reCAPTCHA: ${err.message || 'Unknown error'}`);
      }
    }
    
    // Cleanup function to clear recaptcha when component unmounts
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [isPhoneVerified, isCodeSent]);

  // Mutation to update phone number in the database
  const updatePhoneMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      if (!user) throw new Error('User not authenticated');
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, { 
        phoneNumber 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Phone number updated',
        description: 'Your phone number has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update phone number',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to verify the phone number in our database after Firebase verification
  const verifyPhoneMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      // This API endpoint doesn't actually verify the Firebase code,
      // it just updates the user's phoneVerified status in our database
      const res = await apiRequest('POST', `/api/users/${user.id}/phone-verification/verify`, {
        code: 'firebase-verified' // The actual code doesn't matter as Firebase already verified it
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update verification status');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      setIsPhoneVerified(true);
      toast({
        title: 'Phone verified',
        description: 'Your phone number has been verified successfully.',
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !phone.trim()) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Format phone number to include '+' if not already present
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First update the phone number in the database
      await updatePhoneMutation.mutateAsync(formattedPhone);
      
      // Then send verification code via Firebase
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized. Please refresh the page and try again.');
      }
      
      const result = await sendVerificationCode(formattedPhone, recaptchaVerifierRef.current);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send verification code');
      }
      
      // Save the confirmation result for later verification
      confirmationResultRef.current = result.confirmationResult;
      
      // Success - show code entry form
      setIsCodeSent(true);
      toast({
        title: 'Verification code sent',
        description: 'Please check your phone for the verification code.',
      });
      
    } catch (error: any) {
      console.error('Error in phone verification flow:', error);
      setError(error.message || 'Failed to send verification code');
      toast({
        title: 'Failed to send code',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
      
      // Reset recaptcha on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !code.trim()) {
      toast({
        title: 'Verification code required',
        description: 'Please enter the verification code sent to your phone.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!confirmationResultRef.current) {
      toast({
        title: 'Session expired',
        description: 'Your verification session has expired. Please request a new code.',
        variant: 'destructive',
      });
      setIsCodeSent(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify the code with Firebase
      const result = await verifyPhoneNumber(confirmationResultRef.current, code);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Invalid verification code');
      }
      
      // If Firebase verification is successful, update our database
      await verifyPhoneMutation.mutateAsync();
      
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Failed to verify code');
      toast({
        title: 'Verification Failed',
        description: error.message || 'Please try again. Make sure you entered the correct code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsCodeSent(false);
    setError(null);
    // Reset recaptcha
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
    // Force re-render to recreate recaptcha
    setTimeout(() => {
      try {
        recaptchaVerifierRef.current = initializeRecaptcha('recaptcha-container');
      } catch (err) {
        console.error('Failed to reinitialize reCAPTCHA:', err);
      }
    }, 100);
  };

  if (isPhoneVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phone Verification</CardTitle>
          <CardDescription>Your phone number has been verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span>Phone number verified</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your phone number: {user?.phoneNumber}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setIsPhoneVerified(false)}>
            Change Phone Number
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          {isCodeSent
            ? 'Enter the verification code sent to your phone.'
            : 'Verify your phone number to enable secure token transfers.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isCodeSent ? (
          <form onSubmit={handleCodeSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Try Again
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePhoneSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g. +1 for US)
                </p>
              </div>
              
              {/* reCAPTCHA container */}
              <div className="mt-2">
                <Label>Verification</Label>
                <div 
                  id="recaptcha-container" 
                  ref={recaptchaContainerRef}
                  className="mt-2"
                ></div>
              </div>
            </div>
            
            <Button 
              id="send-code-button"
              className="mt-4 w-full" 
              type="submit" 
              disabled={isLoading || !phone}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
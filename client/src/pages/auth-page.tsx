import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  // Redirect if already authenticated (but still render to avoid hook rule violations)
  if (!authLoading && isAuthenticated) {
    setLocation("/");
  }

  const sendOtpMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const res = await apiRequest("POST", "/api/auth/send-otp", data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      setEmail(variables.email);
      otpForm.setValue('email', variables.email);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: `A 6-digit code has been sent to ${variables.email}${data.debug ? ` (Code: ${data.debug.otp})` : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpFormData) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.firstName || data.user.email}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = (data: EmailFormData) => {
    sendOtpMutation.mutate(data);
  };

  const onOtpSubmit = (data: OtpFormData) => {
    verifyOtpMutation.mutate(data);
  };

  const backToEmail = () => {
    setStep('email');
    setEmail('');
    emailForm.reset();
    otpForm.reset();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, show loading while redirect happens
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email to access the Estimation Tool
            </p>
          </div>

          {step === 'email' ? (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Login
                </CardTitle>
                <CardDescription>
                  We'll send you a 6-digit code to verify your identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email address"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={sendOtpMutation.isPending}
                      data-testid="button-send-otp"
                    >
                      {sendOtpMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Code
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Enter Verification Code
                </CardTitle>
                <CardDescription>
                  We sent a 6-digit code to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              className="text-center text-lg font-mono tracking-widest"
                              data-testid="input-otp"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={verifyOtpMutation.isPending}
                        data-testid="button-verify-otp"
                      >
                        {verifyOtpMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify & Login
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={backToEmail}
                        data-testid="button-back-to-email"
                      >
                        Back to Email
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our terms of service and privacy policy.
          </div>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Project Estimation Tool</h2>
            <p className="text-lg text-muted-foreground">
              Streamline your project planning with automated hour calculations and comprehensive reporting.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span>Role-based access control</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span>Interactive dashboard charts</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span>Comprehensive reporting</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span>Automated calculations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated (but still render to avoid hook rule violations)
  if (!authLoading && isAuthenticated) {
    setLocation("/");
  }

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.displayName || data.user.email}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
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
              Sign in with your Revalsys credentials
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Login
              </CardTitle>
              <CardDescription>
                Enter your Revalsys credentials to access the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your username"
                            data-testid="input-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

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
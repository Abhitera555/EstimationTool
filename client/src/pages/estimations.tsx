import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Calculator } from "lucide-react";
import EstimationStepper from "@/components/estimation/estimation-stepper";
import type { Project, ComplexityMaster, ScreenTypeMaster } from "@shared/schema";

export default function Estimations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const { data: complexities, isLoading: complexitiesLoading, error: complexitiesError } = useQuery<ComplexityMaster[]>({
    queryKey: ["/api/complexity"],
    retry: false,
  });

  const { data: screenTypes, isLoading: screenTypesLoading, error: screenTypesError } = useQuery<ScreenTypeMaster[]>({
    queryKey: ["/api/screen-types"],
    retry: false,
  });

  // Handle errors
  const errors = [projectsError, complexitiesError, screenTypesError].filter(Boolean);
  if (errors.length > 0) {
    const error = errors[0] as Error;
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
  }

  if (isLoading || projectsLoading || complexitiesLoading || screenTypesLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="h-8 bg-muted rounded mb-8 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Create New Estimation
          </h1>
        </div>

        {/* Estimation Creation Stepper */}
        <EstimationStepper 
          projects={projects || []}
          complexities={complexities || []}
          screenTypes={screenTypes || []}
        />
      </div>
    </div>
  );
}

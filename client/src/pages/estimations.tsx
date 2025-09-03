import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, Plus, Trash2, Clock, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { Project, ComplexityMaster, ScreenTypeMaster, Screen, GenericScreenType } from "@shared/schema";
import { SmartEstimationEngine } from "@/lib/estimation-engine";

// Use the standard EstimationScreenData interface
import type { EstimationScreenData } from "@/lib/types";

interface EstimationScreen {
  screenId: number;
  screenName: string;
  complexity: string;
  screenType: string;
  hours: number;
}

export default function Estimations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [estimationName, setEstimationName] = useState("");
  const [versionNumber, setVersionNumber] = useState("");
  const [estimationScreens, setEstimationScreens] = useState<EstimationScreen[]>([]);
  const [errors, setErrors] = useState<{
    project?: string;
    name?: string;
    version?: string;
    screens?: string;
  }>({});

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

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const { data: complexities, isLoading: complexitiesLoading } = useQuery<ComplexityMaster[]>({
    queryKey: ["/api/complexity"],
    retry: false,
  });

  const { data: screenTypes, isLoading: screenTypesLoading } = useQuery<ScreenTypeMaster[]>({
    queryKey: ["/api/screen-types"],
    retry: false,
  });

  const { data: genericScreenTypes, isLoading: genericScreenTypesLoading } = useQuery<GenericScreenType[]>({
    queryKey: ["/api/generic-screen-types"],
    retry: false,
  });

  const { data: projectScreens } = useQuery<Screen[]>({
    queryKey: ["/api/projects", selectedProjectId, "screens"],
    retry: false,
    enabled: !!selectedProjectId,
  });

  const createEstimationMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/estimations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimations"] });
      toast({
        title: "Success",
        description: "Estimation created successfully",
      });
      // Reset form
      setSelectedProjectId("");
      setEstimationName("");
      setVersionNumber("");
      setEstimationScreens([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create estimation",
        variant: "destructive",
      });
    },
  });

  const addScreen = () => {
    if (!selectedProjectId) {
      toast({
        title: "Select Project First",
        description: "Please select a project before adding screens",
        variant: "destructive",
      });
      return;
    }

    if (!projectScreens || projectScreens.length === 0) {
      toast({
        title: "No Screens Available",
        description: "Please add screens to this project first using the Masters menu",
        variant: "destructive",
      });
      return;
    }

    // Clear screens error when adding screen
    setErrors(prev => ({ ...prev, screens: undefined }));

    const defaultComplexity = complexities?.find(c => c.name === 'Simple') || complexities?.[0];
    const defaultScreenType = screenTypes?.find(s => s.name === 'Static') || screenTypes?.[0];
    const defaultScreen = projectScreens[0];
    
    if (defaultComplexity && defaultScreenType && defaultScreen) {
      const newScreen: EstimationScreen = {
        screenId: defaultScreen.id,
        screenName: defaultScreen.name,
        complexity: defaultComplexity.name,
        screenType: defaultScreenType.name,
        hours: Math.round(4 * parseFloat(defaultComplexity.multiplier || '1.00') * parseFloat(defaultScreenType.multiplier || '1.00')),
      };
      setEstimationScreens([...estimationScreens, newScreen]);
    }
  };

  const removeScreen = (index: number) => {
    setEstimationScreens(estimationScreens.filter((_, i) => i !== index));
  };

  const updateScreen = (index: number, field: keyof EstimationScreen, value: any) => {
    const updatedScreens = [...estimationScreens];
    updatedScreens[index] = { ...updatedScreens[index], [field]: value };
    
    // Recalculate hours based on complexity and screen type using master data
    if (field === 'complexity' || field === 'screenType') {
      const complexity = field === 'complexity' ? value : updatedScreens[index].complexity;
      const screenType = field === 'screenType' ? value : updatedScreens[index].screenType;
      
      let complexityHours = 0;
      let screenTypeHours = 0;
      
      // Use Smart Estimation Engine with interdependency awareness
      const selectedScreen = projectScreens?.find(s => s.id === updatedScreens[index].screenId);
      const genericScreenType = genericScreenTypes?.find(gst => 
        selectedScreen?.name.toLowerCase().includes(gst.name.toLowerCase()) ||
        gst.name.toLowerCase().includes('form') // Default fallback
      ) || genericScreenTypes?.[0];
      
      if (complexity && screenType && complexities && screenTypes && genericScreenType) {
        const complexityData = complexities.find(c => c.name === complexity);
        const behaviorData = screenTypes.find(s => s.name === screenType);
        
        if (complexityData && behaviorData) {
          // Use smart estimation engine
          const estimationContext = {
            screenType: genericScreenType,
            complexity: complexityData,
            behavior: behaviorData
          };
          
          updatedScreens[index].hours = SmartEstimationEngine.calculateHours(estimationContext);
          
          // Log estimation explanation for transparency
          console.log('🎯 Smart Estimation:', SmartEstimationEngine.getEstimationExplanation(estimationContext));
        }
      }
    }
    
    setEstimationScreens(updatedScreens);
  };

  const totalHours = estimationScreens.reduce((sum, screen) => sum + screen.hours, 0);
  const estimatedDays = Math.ceil(totalHours / 8);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    // Optional validation - only check if data is provided
    if (estimationName.trim() && estimationName.trim().length < 2) {
      newErrors.name = "Estimation name must be at least 2 characters";
    }
    
    if (versionNumber.trim() && !/^v?\d+(\.\d+)*$/.test(versionNumber.trim())) {
      newErrors.version = "Version format should be like v1.0 or 1.0.0";
    }
    
    // Only validate screens if they exist
    if (estimationScreens.length > 0) {
      const hasIncompleteScreen = estimationScreens.some(screen => 
        !screen.screenId || !screen.complexity || !screen.screenType
      );
      if (hasIncompleteScreen) {
        newErrors.screens = "Please complete all screen configurations";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate missing values
    const finalEstimationName = estimationName.trim() || 
      `Estimation ${new Date().toLocaleDateString()}`;
    const finalVersion = versionNumber.trim() || "1.0";
    const finalProjectId = selectedProjectId || (projects?.[0]?.id.toString() || "1");
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before submitting",
        variant: "destructive",
      });
      return;
    }

    const estimation = {
      projectId: parseInt(finalProjectId),
      name: finalEstimationName,
      totalHours,
      versionNumber: finalVersion,
    };

    const details = estimationScreens.map(screen => ({
      screenId: screen.screenId,
      complexityId: complexities?.find(c => c.name === screen.complexity)?.id || 1,
      screenTypeId: screenTypes?.find(st => st.name === screen.screenType)?.id || 1,
      calculatedHours: screen.hours,
    }));

    createEstimationMutation.mutate({ estimation, details });
  };

  if (isLoading || projectsLoading || complexitiesLoading || screenTypesLoading || genericScreenTypesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="h-8 bg-white/60 rounded-lg mb-8 animate-pulse"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/60 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              Create New Estimation
            </h1>
            <p className="text-slate-600 text-lg">Build accurate project estimations with our intelligent calculation engine</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Selection */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Project Information
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">Select your project and provide basic estimation details</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium text-slate-700">Project</Label>
                  <Select value={selectedProjectId} onValueChange={(value) => {
                    setSelectedProjectId(value);
                    setEstimationScreens([]);
                    setErrors(prev => ({ ...prev, project: undefined }));
                  }}>
                    <SelectTrigger className={`bg-white border-slate-200 ${errors.project ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.project && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.project}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimationName" className="text-sm font-medium text-slate-700">Estimation Name</Label>
                  <Input
                    id="estimationName"
                    value={estimationName}
                    onChange={(e) => {
                      setEstimationName(e.target.value);
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter estimation name..."
                    className={`bg-white border-slate-200 ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version" className="text-sm font-medium text-slate-700">Version</Label>
                  <Input
                    id="version"
                    value={versionNumber}
                    onChange={(e) => {
                      setVersionNumber(e.target.value);
                      setErrors(prev => ({ ...prev, version: undefined }));
                    }}
                    placeholder="v1.0 or 1.0.0"
                    className={`bg-white border-slate-200 ${errors.version ? 'border-red-500' : ''}`}
                  />
                  {errors.version && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.version}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screen Configuration */}
          {selectedProjectId && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Screen Configuration
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Add and configure screens for accurate hour estimation</p>
                </div>
                <Button
                  type="button"
                  onClick={addScreen}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Screen
                </Button>
              </CardHeader>
              <CardContent>
                {errors.screens && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600">
                      {errors.screens}
                    </AlertDescription>
                  </Alert>
                )}
                {estimationScreens.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">No screens added yet</p>
                    <p className="text-sm">Click "Add Screen" to start configuring your estimation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {estimationScreens.map((screen, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Screen</Label>
                            <Select 
                              value={screen.screenId.toString()} 
                              onValueChange={(value) => {
                                const selectedScreen = projectScreens?.find(s => s.id.toString() === value);
                                if (selectedScreen) {
                                  updateScreen(index, 'screenId', parseInt(value));
                                  updateScreen(index, 'screenName', selectedScreen.name);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {projectScreens?.map((projectScreen) => (
                                  <SelectItem key={projectScreen.id} value={projectScreen.id.toString()}>
                                    {projectScreen.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Complexity</Label>
                            <Select 
                              value={screen.complexity} 
                              onValueChange={(value) => updateScreen(index, 'complexity', value)}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {complexities?.map((complexity) => (
                                  <SelectItem key={complexity.id} value={complexity.name}>
                                    {complexity.name} ({complexity.hours}h)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Screen Type</Label>
                            <Select 
                              value={screen.screenType} 
                              onValueChange={(value) => updateScreen(index, 'screenType', value)}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {screenTypes?.map((screenType) => (
                                  <SelectItem key={screenType.id} value={screenType.name}>
                                    {screenType.name} ({screenType.hours}h)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="text-center">
                            <Label className="text-sm font-medium text-slate-700">Total Hours</Label>
                            <div className="mt-2">
                              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg font-semibold">
                                {screen.hours}h
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeScreen(index)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary - Show when screens exist */}
          {estimationScreens.length > 0 && (
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Estimation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{estimationScreens.length}</div>
                    <p className="text-blue-100">Screens Configured</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{totalHours}</div>
                    <p className="text-blue-100">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{estimatedDays}</div>
                    <p className="text-blue-100">Estimated Days</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={createEstimationMutation.isPending}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
                  >
                    {createEstimationMutation.isPending ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Create Estimation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Empty Estimation Button - Show when no screens */}
          {estimationScreens.length === 0 && (
            <Card className="shadow-lg border-2 border-dashed border-slate-300 bg-slate-50/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to Create</h3>
                  <p className="text-slate-500">You can create an estimation now and add screens later, or add screens first for a complete estimation.</p>
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  disabled={createEstimationMutation.isPending}
                  className="px-8 py-4 text-lg font-semibold rounded-xl border-slate-300 hover:bg-slate-100"
                >
                  {createEstimationMutation.isPending ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Create Basic Estimation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}

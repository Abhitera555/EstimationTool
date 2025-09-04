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
import type { Project, ComplexityMaster, ScreenTypeMaster, GenericScreenType, Screen } from "@shared/schema";
import { calculateEstimatedDays, formatDays } from "@/lib/estimation-engine";

interface EstimationItem {
  id: string; // unique identifier for React keys
  screenType: string;
  complexity: string;
  screenTypeName: string;
  hours: number;
}

export default function SimplifiedEstimations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [estimationName, setEstimationName] = useState("");
  const [versionNumber, setVersionNumber] = useState("");
  const [estimationItems, setEstimationItems] = useState<EstimationItem[]>([]);
  const [errors, setErrors] = useState<{
    project?: string;
    name?: string;
    version?: string;
    items?: string;
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

  const { data: allScreens } = useQuery<Screen[]>({
    queryKey: ["/api/screens"],
    retry: false,
  });


  const createEstimationMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/estimations", data);
    },
    onSuccess: () => {
      // Invalidate all estimation-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/estimations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Success",
        description: "Estimation created successfully! Check the 'Estimations' page to see your new estimation.",
      });
      
      // Reset form
      setSelectedProjectId("");
      setEstimationName("");
      setVersionNumber("");
      setEstimationItems([]);
      
      // Navigate to history page to see the new estimation
      setTimeout(() => {
        window.location.href = "/history";
      }, 2000);
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

  // Helper function to fetch hours from the mapping
  const getHoursFromMapping = async (complexity: string, screenBehavior: string): Promise<number> => {
    try {
      if (!complexity || !screenBehavior) return 0;
      
      const response = await apiRequest('GET', `/api/hour-mapping/${encodeURIComponent(complexity)}/${encodeURIComponent(screenBehavior)}`);
      const data = await response.json();
      return data.hours || 0;
    } catch (error) {
      console.error('Error fetching hours from mapping:', error);
      return 0;
    }
  };

  const addEstimationItem = () => {
    const newItem: EstimationItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      screenType: '', // Start empty - user must select
      complexity: '', // Start empty - user must select
      screenTypeName: '', // Start empty - user must select (this is screen behavior)
      hours: 0, // Start with 0 hours
    };
    setEstimationItems([...estimationItems, newItem]);
    setErrors(prev => ({ ...prev, items: undefined }));
  };

  const removeEstimationItem = (id: string) => {
    setEstimationItems(estimationItems.filter(item => item.id !== id));
  };

  const updateEstimationItem = async (id: string, field: keyof EstimationItem, value: any) => {
    const updatedItems = await Promise.all(estimationItems.map(async (item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate hours when complexity or screenTypeName changes
        if (field === 'complexity' || field === 'screenTypeName') {
          const complexity = field === 'complexity' ? value : updatedItem.complexity;
          const screenBehavior = field === 'screenTypeName' ? value : updatedItem.screenTypeName;
          
          // Use the new hour mapping instead of adding complexity + screen type hours
          updatedItem.hours = await getHoursFromMapping(complexity, screenBehavior);
        }
        
        return updatedItem;
      }
      return item;
    }));
    
    setEstimationItems(updatedItems);
  };

  const totalHours = estimationItems.reduce((sum, item) => sum + item.hours, 0);
  const estimatedDays = calculateEstimatedDays(totalHours);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!selectedProjectId) {
      newErrors.project = "Please select a project";
    }
    
    if (!estimationName.trim()) {
      newErrors.name = "Estimation name is required";
    } else if (estimationName.trim().length < 3) {
      newErrors.name = "Estimation name must be at least 3 characters";
    }
    
    if (versionNumber.trim() && !/^v?\d+\.\d+(\.\d+)?$/.test(versionNumber.trim())) {
      newErrors.version = "Version must be in format v1.0 or 1.0.0";
    }
    
    if (estimationItems.length === 0) {
      newErrors.items = "Please add at least one estimation item";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Use a real screen ID from the database for the simplified estimation
    const defaultScreenId = 6; // Using an existing screen from the database
    
    const estimationData = {
      estimation: {
        projectId: parseInt(selectedProjectId),
        name: estimationName.trim(),
        versionNumber: versionNumber.trim(),
        totalHours,
        notes: `Simplified estimation with ${estimationItems.length} items: ${estimationItems.map(item => `${item.screenType} (${item.complexity}, ${item.screenTypeName})`).join(', ')}`
      },
      details: estimationItems.map(item => {
        // Find IDs from master data
        const complexityId = complexities?.find(c => c.name === item.complexity)?.id || 1;
        const screenTypeId = screenTypes?.find(s => s.name === item.screenTypeName)?.id || 1;
        
        return {
          screenId: defaultScreenId,
          complexityId,
          screenTypeId,
          calculatedHours: item.hours
        };
      })
    };

    createEstimationMutation.mutate(estimationData);
  };

  if (isLoading || projectsLoading || complexitiesLoading || screenTypesLoading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-6">
      <div className="container mx-auto max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Create Estimation
              </h1>
              <p className="text-slate-600 text-lg">
                Simple dropdown-based estimation: <strong>Project</strong> → <strong>Screen</strong> → <strong>Complexity</strong> → <strong>Screen Type</strong> = <strong>Auto Hours</strong>
              </p>
            </div>

            {/* Project Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-800">Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="project" className="text-sm font-medium text-slate-700">Project *</Label>
                    <Select value={selectedProjectId} onValueChange={(value) => {
                      setSelectedProjectId(value);
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
                    <Label htmlFor="estimationName" className="text-sm font-medium text-slate-700">Estimation Name *</Label>
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

            {/* Estimation Items */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-800">Estimation Items</CardTitle>
                <Button
                  type="button"
                  onClick={addEstimationItem}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {errors.items && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600">
                      {errors.items}
                    </AlertDescription>
                  </Alert>
                )}
                {estimationItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">No items added yet</p>
                    <p className="text-sm">Click "Add Item" to start building your estimation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {estimationItems.map((item, index) => (
                      <div key={item.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Screen</Label>
                            <Select 
                              value={item.screenType} 
                              onValueChange={(value) => updateEstimationItem(item.id, 'screenType', value)}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select screen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allScreens?.map((screen) => (
                                  <SelectItem key={screen.id} value={screen.name}>
                                    {screen.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Complexity</Label>
                            <Select 
                              value={item.complexity} 
                              onValueChange={(value) => updateEstimationItem(item.id, 'complexity', value)}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select complexity..." />
                              </SelectTrigger>
                              <SelectContent>
                                {complexities?.map((complexity) => (
                                  <SelectItem key={complexity.id} value={complexity.name}>
                                    {complexity.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Screen Type</Label>
                            <Select 
                              value={item.screenTypeName} 
                              onValueChange={(value) => updateEstimationItem(item.id, 'screenTypeName', value)}
                            >
                              <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Select behavior..." />
                              </SelectTrigger>
                              <SelectContent>
                                {screenTypes?.map((screenType) => (
                                  <SelectItem key={screenType.id} value={screenType.name}>
                                    {screenType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="text-center">
                            <Label className="text-sm font-medium text-slate-700">Total Hours</Label>
                            <div className="mt-2">
                              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg font-semibold">
                                {item.hours}h
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeEstimationItem(item.id)}
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

            {/* Summary */}
            {estimationItems.length > 0 && (
              <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{estimationItems.length}</div>
                      <p className="text-blue-100">Items</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{totalHours}</div>
                      <p className="text-blue-100">Total Hours</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{formatDays(estimatedDays)}</div>
                      <p className="text-blue-100">Days (&le;4hrs=0.5day, &gt;4hrs=1day)</p>
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
          </div>
        </form>
      </div>
    </div>
  );
}
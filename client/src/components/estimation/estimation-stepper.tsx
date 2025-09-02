import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Save, Clock, CheckCircle } from "lucide-react";
import ScreenEstimationRow from "./screen-estimation-row";
import type { Project, ComplexityMaster, ScreenTypeMaster, Screen } from "@shared/schema";
import type { EstimationFormData, EstimationScreenData } from "@/lib/types";

interface EstimationStepperProps {
  projects: Project[];
  complexities: ComplexityMaster[];
  screenTypes: ScreenTypeMaster[];
}

export default function EstimationStepper({ projects, complexities, screenTypes }: EstimationStepperProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EstimationFormData>({
    projectId: 0,
    name: "",
    versionNumber: "",
    notes: "",
    screens: [],
  });

  const { data: projectScreens, isLoading: screensLoading } = useQuery<Screen[]>({
    queryKey: ["/api/projects", formData.projectId.toString(), "screens"],
    retry: false,
    enabled: formData.projectId > 0,
  });

  const createEstimationMutation = useMutation({
    mutationFn: async (data: EstimationFormData) => {
      const totalHours = data.screens.reduce((sum, screen) => sum + screen.calculatedHours, 0);
      
      const estimation = {
        projectId: data.projectId,
        name: data.name,
        totalHours,
        versionNumber: data.versionNumber,
        notes: data.notes || undefined,
      };

      const details = data.screens.map(screen => ({
        screenId: screen.screenId,
        complexityId: screen.complexityId,
        screenTypeId: screen.screenTypeId,
        calculatedHours: screen.calculatedHours,
      }));

      await apiRequest("POST", "/api/estimations", { estimation, details });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Estimation created successfully",
      });
      
      // Reset form
      setFormData({
        projectId: 0,
        name: "",
        versionNumber: "",
        notes: "",
        screens: [],
      });
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

  const handleProjectChange = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectId: parseInt(projectId),
      screens: [], // Reset screens when project changes
    }));
  };

  const handleAddScreen = () => {
    if (!projectScreens || projectScreens.length === 0) {
      toast({
        title: "No Screens Available",
        description: "Please add screens to this project first",
        variant: "destructive",
      });
      return;
    }

    const newScreen: EstimationScreenData = {
      screenId: projectScreens[0].id,
      complexityId: complexities[0]?.id || 0,
      screenTypeId: screenTypes[0]?.id || 0,
      calculatedHours: (complexities[0]?.hours || 0) + (screenTypes[0]?.hours || 0),
    };

    setFormData(prev => ({
      ...prev,
      screens: [...prev.screens, newScreen],
    }));
  };

  const handleUpdateScreen = (index: number, updatedScreen: EstimationScreenData) => {
    setFormData(prev => ({
      ...prev,
      screens: prev.screens.map((screen, i) => i === index ? updatedScreen : screen),
    }));
  };

  const handleRemoveScreen = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screens: prev.screens.filter((_, i) => i !== index),
    }));
  };

  const calculateTotalHours = () => {
    return formData.screens.reduce((sum, screen) => sum + screen.calculatedHours, 0);
  };

  const calculateEstimatedDays = () => {
    return Math.ceil(calculateTotalHours() / 8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast({
        title: "Validation Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Estimation name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.versionNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Version number is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.screens.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one screen",
        variant: "destructive",
      });
      return;
    }

    createEstimationMutation.mutate(formData);
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">1</Badge>
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={formData.projectId.toString()} onValueChange={handleProjectChange}>
                <SelectTrigger data-testid="select-estimation-project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimationName">Estimation Name *</Label>
              <Input
                id="estimationName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter estimation name"
                required
                data-testid="input-estimation-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versionNumber">Version Number *</Label>
              <Input
                id="versionNumber"
                value={formData.versionNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, versionNumber: e.target.value }))}
                placeholder="e.g., v1.0, v2.1"
                required
                data-testid="input-version-number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Screen Configuration */}
      {formData.projectId > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">2</Badge>
              Configure Screens
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddScreen}
              disabled={screensLoading || !projectScreens || projectScreens.length === 0}
              data-testid="button-add-screen-estimation"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Screen
            </Button>
          </CardHeader>
          <CardContent>
            {screensLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : projectScreens && projectScreens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No screens available for this project</p>
                <p className="text-sm">Please add screens to this project first</p>
              </div>
            ) : formData.screens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No screens added to estimation</p>
                <p className="text-sm">Click "Add Screen" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.screens.map((screen, index) => (
                  <ScreenEstimationRow
                    key={index}
                    screen={screen}
                    index={index}
                    availableScreens={projectScreens || []}
                    complexities={complexities}
                    screenTypes={screenTypes}
                    onUpdate={handleUpdateScreen}
                    onRemove={handleRemoveScreen}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Estimation Summary */}
      {formData.screens.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white">3</Badge>
              Estimation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center border-r border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-1" data-testid="text-total-screens-summary">
                  {formData.screens.length}
                </div>
                <p className="text-muted-foreground">Total Screens</p>
              </div>
              <div className="text-center border-r border-blue-200">
                <div className="text-3xl font-bold text-green-600 mb-1" data-testid="text-total-hours-summary">
                  {calculateTotalHours()}
                </div>
                <p className="text-muted-foreground">Total Hours</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1" data-testid="text-estimated-days">
                  {calculateEstimatedDays()}
                </div>
                <p className="text-muted-foreground">Days (8hrs/day)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={4}
                  data-testid="input-estimation-notes"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createEstimationMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  data-testid="button-save-estimation"
                >
                  {createEstimationMutation.isPending ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Estimation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}

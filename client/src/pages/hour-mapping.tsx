import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Clock, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ComplexityScreenBehaviorMapping, ComplexityMaster, ScreenTypeMaster } from "@shared/schema";

export default function HourMappingPage() {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({
    complexityName: "",
    screenBehavior: "",
    hours: ""
  });

  // Fetch hour mapping data
  const { data: hourMapping, isLoading } = useQuery<ComplexityScreenBehaviorMapping[]>({
    queryKey: ['/api/hour-mapping'],
  });

  // Fetch complexity and screen type options for dropdowns
  const { data: complexities } = useQuery<ComplexityMaster[]>({
    queryKey: ['/api/complexity'],
  });

  const { data: screenTypes } = useQuery<ScreenTypeMaster[]>({
    queryKey: ['/api/screen-types'],
  });

  // Create hour mapping mutation
  const createMutation = useMutation({
    mutationFn: async ({ complexityName, screenBehavior, hours }: { 
      complexityName: string; 
      screenBehavior: string; 
      hours: number; 
    }) => {
      const res = await apiRequest('POST', '/api/hour-mapping', { complexityName, screenBehavior, hours });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hour-mapping'] });
      toast({
        title: "Success",
        description: "New hour mapping created successfully",
      });
      setIsAddDialogOpen(false);
      setNewMapping({ complexityName: "", screenBehavior: "", hours: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update hour mapping mutation
  const updateMutation = useMutation({
    mutationFn: async ({ complexityName, screenBehavior, hours }: { 
      complexityName: string; 
      screenBehavior: string; 
      hours: number; 
    }) => {
      const res = await apiRequest('PUT', `/api/hour-mapping/${encodeURIComponent(complexityName)}/${encodeURIComponent(screenBehavior)}`, { hours });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hour-mapping'] });
      toast({
        title: "Success",
        description: "Hour mapping updated successfully",
      });
      setEditingCell(null);
      setEditValue("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (complexityName: string, screenBehavior: string, currentHours: number) => {
    const cellKey = `${complexityName}-${screenBehavior}`;
    setEditingCell(cellKey);
    setEditValue(currentHours.toString());
  };

  const handleSave = (complexityName: string, screenBehavior: string) => {
    const hours = parseInt(editValue);
    if (isNaN(hours) || hours < 0) {
      toast({
        title: "Invalid Input",
        description: "Hours must be a non-negative number",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ complexityName, screenBehavior, hours });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleCreateMapping = () => {
    const hours = parseInt(newMapping.hours);
    if (!newMapping.complexityName || !newMapping.screenBehavior || isNaN(hours) || hours < 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields with valid values",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({ 
      complexityName: newMapping.complexityName, 
      screenBehavior: newMapping.screenBehavior, 
      hours 
    });
  };

  const getComplexityColor = (complexity: string) => {
    const normalizedComplexity = complexity.toLowerCase();
    switch (normalizedComplexity) {
      case 'complex':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScreenTypeColor = (screenType: string) => {
    const normalizedType = screenType.toLowerCase();
    switch (normalizedType) {
      case 'static':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dynamic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'partial dynamic':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            Hour Mapping
          </h1>
          <p className="text-slate-600 mt-2">
            Configure hour estimates for each complexity and screen type combination
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-add-mapping"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Mapping
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Hour Mapping</DialogTitle>
              <DialogDescription>
                Create a new hour mapping for a complexity and screen type combination.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="complexity">Complexity</Label>
                <Select
                  value={newMapping.complexityName}
                  onValueChange={(value) => setNewMapping(prev => ({ ...prev, complexityName: value }))}
                >
                  <SelectTrigger data-testid="select-new-complexity">
                    <SelectValue placeholder="Select complexity level" />
                  </SelectTrigger>
                  <SelectContent>
                    {complexities?.map((complexity) => (
                      <SelectItem key={complexity.id} value={complexity.name.toLowerCase()}>
                        {complexity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="screenType">Screen Type</Label>
                <Select
                  value={newMapping.screenBehavior}
                  onValueChange={(value) => setNewMapping(prev => ({ ...prev, screenBehavior: value }))}
                >
                  <SelectTrigger data-testid="select-new-screen-type">
                    <SelectValue placeholder="Select screen type" />
                  </SelectTrigger>
                  <SelectContent>
                    {screenTypes?.map((screenType) => (
                      <SelectItem key={screenType.id} value={screenType.name.toLowerCase()}>
                        {screenType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  placeholder="Enter hours"
                  value={newMapping.hours}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, hours: e.target.value }))}
                  data-testid="input-new-hours"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMapping}
                disabled={createMutation.isPending}
                data-testid="button-save-add"
              >
                {createMutation.isPending ? "Creating..." : "Create Mapping"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hour Mapping Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle>Complexity vs Screen Type Hour Matrix</CardTitle>
          <CardDescription>
            Click on any hour value to edit it. This matrix is used for automatic hour calculations in estimations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Complexity</TableHead>
                  <TableHead className="w-32">Screen Type</TableHead>
                  <TableHead className="w-24 text-center">Hours</TableHead>
                  <TableHead className="w-20 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourMapping?.map((mapping) => {
                  const cellKey = `${mapping.complexityName}-${mapping.screenBehavior}`;
                  const isEditing = editingCell === cellKey;

                  return (
                    <TableRow key={mapping.id} className="group hover:bg-slate-50">
                      <TableCell>
                        <Badge className={`capitalize ${getComplexityColor(mapping.complexityName)}`}>
                          {mapping.complexityName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${getScreenTypeColor(mapping.screenBehavior)}`}>
                          {mapping.screenBehavior}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 h-8 text-center"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSave(mapping.complexityName, mapping.screenBehavior);
                              } else if (e.key === 'Escape') {
                                handleCancel();
                              }
                            }}
                            data-testid={`input-hours-${mapping.complexityName}-${mapping.screenBehavior}`}
                          />
                        ) : (
                          <span 
                            className="font-medium text-lg cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => handleEdit(mapping.complexityName, mapping.screenBehavior, mapping.hours)}
                            data-testid={`hours-${mapping.complexityName}-${mapping.screenBehavior}`}
                          >
                            {mapping.hours}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSave(mapping.complexityName, mapping.screenBehavior)}
                              disabled={updateMutation.isPending}
                              data-testid={`button-save-${mapping.complexityName}-${mapping.screenBehavior}`}
                            >
                              <Save className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              disabled={updateMutation.isPending}
                              data-testid={`button-cancel-${mapping.complexityName}-${mapping.screenBehavior}`}
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(mapping.complexityName, mapping.screenBehavior, mapping.hours)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-edit-${mapping.complexityName}-${mapping.screenBehavior}`}
                          >
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="h-3 w-3 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">How Hour Mapping Works</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• When creating estimations, the system automatically looks up hours based on the selected complexity and screen type combination.</p>
                <p>• Changes to this matrix will immediately affect all new estimations created after the update.</p>
                <p>• Existing estimations will retain their original hour calculations and won't be affected.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
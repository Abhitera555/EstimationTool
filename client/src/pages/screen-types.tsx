import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Monitor, Plus, Edit, Trash2 } from "lucide-react";
import ScreenTypeModal from "@/components/modals/screen-type-modal";
import type { ScreenTypeMaster } from "@shared/schema";

const screenTypeColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-green-100 text-green-800",
};

export default function ScreenTypes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScreenType, setEditingScreenType] = useState<ScreenTypeMaster | null>(null);

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

  const { data: screenTypes, isLoading: screenTypesLoading, error } = useQuery<ScreenTypeMaster[]>({
    queryKey: ["/api/screen-types"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/screen-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screen-types"] });
      toast({
        title: "Success",
        description: "Screen type deleted successfully",
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
        description: "Failed to delete screen type",
        variant: "destructive",
      });
    },
  });

  if (error) {
    if (isUnauthorizedError(error as Error)) {
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

  const handleEdit = (screenType: ScreenTypeMaster) => {
    setEditingScreenType(screenType);
    setIsModalOpen(true);
  };

  const handleDelete = async (screenType: ScreenTypeMaster) => {
    if (window.confirm(`Are you sure you want to delete "${screenType.name}"?`)) {
      deleteMutation.mutate(screenType.id);
    }
  };

  const handleAddNew = () => {
    setEditingScreenType(null);
    setIsModalOpen(true);
  };

  const getScreenTypeColor = (hours: number) => {
    if (hours <= 6) return screenTypeColors.low;
    if (hours <= 10) return screenTypeColors.medium;
    return screenTypeColors.high;
  };

  if (isLoading || screenTypesLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="h-8 bg-muted rounded mb-8 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              Screen Type Master
            </h1>
            <p className="text-slate-600 text-lg">Configure screen types: Static/Dynamic/Partial Dynamic with hour weightages</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-6 py-3 rounded-lg font-medium shadow-lg"
            data-testid="button-add-screen-type"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Screen Type
          </Button>
        </div>

        {/* Screen Types List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">Screen Types & Hour Weightages</CardTitle>
            <p className="text-sm text-slate-600 mt-2">These hours will be automatically added to estimations based on screen type selection</p>
          </CardHeader>
          <CardContent>
            {!screenTypes || screenTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No screen types found</p>
                <p className="text-sm">Create your first screen type to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Screen Type</th>
                      <th className="text-left p-3 font-semibold">Hours</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenTypes.map((screenType) => (
                      <tr key={screenType.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <Badge 
                            className={getScreenTypeColor(screenType.hours)}
                            data-testid={`badge-screen-type-${screenType.id}`}
                          >
                            {screenType.name}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <strong data-testid={`text-hours-${screenType.id}`}>
                            {screenType.hours} hours
                          </strong>
                        </td>
                        <td className="p-3" data-testid={`text-description-${screenType.id}`}>
                          {screenType.description || '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(screenType)}
                              data-testid={`button-edit-${screenType.id}`}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(screenType)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${screenType.id}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Screen Type Modal */}
        <ScreenTypeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screenType={editingScreenType}
        />
      </div>
    </div>
  );
}

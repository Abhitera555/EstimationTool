import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import ComplexityModal from "@/components/modals/complexity-modal";
import type { ComplexityMaster } from "@shared/schema";

const complexityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function Complexity() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplexity, setEditingComplexity] = useState<ComplexityMaster | null>(null);

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

  const { data: complexities, isLoading: complexitiesLoading, error } = useQuery<ComplexityMaster[]>({
    queryKey: ["/api/complexity"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/complexity/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complexity"] });
      toast({
        title: "Success",
        description: "Complexity type deleted successfully",
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
        description: "Failed to delete complexity type",
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

  const handleEdit = (complexity: ComplexityMaster) => {
    setEditingComplexity(complexity);
    setIsModalOpen(true);
  };

  const handleDelete = async (complexity: ComplexityMaster) => {
    if (window.confirm(`Are you sure you want to delete "${complexity.name}"?`)) {
      deleteMutation.mutate(complexity.id);
    }
  };

  const handleAddNew = () => {
    setEditingComplexity(null);
    setIsModalOpen(true);
  };

  const getComplexityColor = (hours: number) => {
    if (hours <= 10) return complexityColors.low;
    if (hours <= 20) return complexityColors.medium;
    return complexityColors.high;
  };

  if (isLoading || complexitiesLoading) {
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Complexity Master
          </h1>
          <Button 
            onClick={handleAddNew}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            data-testid="button-add-complexity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Complexity Type
          </Button>
        </div>

        {/* Complexity List */}
        <Card>
          <CardHeader>
            <CardTitle>Complexity Types & Hour Weightages</CardTitle>
          </CardHeader>
          <CardContent>
            {!complexities || complexities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No complexity types found</p>
                <p className="text-sm">Create your first complexity type to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Complexity Name</th>
                      <th className="text-left p-3 font-semibold">Hours</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complexities.map((complexity) => (
                      <tr key={complexity.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <Badge 
                            className={getComplexityColor(complexity.hours)}
                            data-testid={`badge-complexity-${complexity.id}`}
                          >
                            {complexity.name}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <strong data-testid={`text-hours-${complexity.id}`}>
                            {complexity.hours} hours
                          </strong>
                        </td>
                        <td className="p-3" data-testid={`text-description-${complexity.id}`}>
                          {complexity.description || '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(complexity)}
                              data-testid={`button-edit-${complexity.id}`}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(complexity)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${complexity.id}`}
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

        {/* Complexity Modal */}
        <ComplexityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          complexity={editingComplexity}
        />
      </div>
    </div>
  );
}

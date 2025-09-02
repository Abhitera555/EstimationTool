import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tv, Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import ScreenModal from "@/components/modals/screen-modal";
import type { Screen, Project } from "@shared/schema";

export default function Screens() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);

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

  const { data: screens, isLoading: screensLoading, error } = useQuery<Screen[]>({
    queryKey: ["/api/projects", selectedProjectId, "screens"],
    retry: false,
    enabled: !!selectedProjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/screens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "screens"] });
      toast({
        title: "Success",
        description: "Screen deleted successfully",
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
        description: "Failed to delete screen",
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

  const handleEdit = (screen: Screen) => {
    setEditingScreen(screen);
    setIsModalOpen(true);
  };

  const handleDelete = async (screen: Screen) => {
    if (window.confirm(`Are you sure you want to delete "${screen.name}"?`)) {
      deleteMutation.mutate(screen.id);
    }
  };

  const handleAddNew = () => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    setEditingScreen(null);
    setIsModalOpen(true);
  };

  const filteredScreens = screens?.filter(screen =>
    screen.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedProject = projects?.find(p => p.id.toString() === selectedProjectId);

  if (isLoading || projectsLoading) {
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
            <Tv className="h-8 w-8" />
            Screen Management
          </h1>
          <Button 
            onClick={handleAddNew}
            disabled={!selectedProjectId}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            data-testid="button-add-screen"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Screen
          </Button>
        </div>

        {/* Project Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Select Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-md">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <p className="text-sm text-muted-foreground mt-2">
                Managing screens for: <strong>{selectedProject.name}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Screens List */}
        {selectedProjectId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Screens List</CardTitle>
                <div className="w-full sm:w-64">
                  <Input
                    placeholder="Search screens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-screens"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {screensLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredScreens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No screens found</p>
                  <p className="text-sm">Add your first screen to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Screen Name</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-left p-3 font-semibold">Created Date</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScreens.map((screen) => (
                        <tr key={screen.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <strong data-testid={`text-screen-name-${screen.id}`}>
                              {screen.name}
                            </strong>
                          </td>
                          <td className="p-3" data-testid={`text-screen-description-${screen.id}`}>
                            {screen.description || '-'}
                          </td>
                          <td className="p-3" data-testid={`text-screen-date-${screen.id}`}>
                            {new Date(screen.createdAt!).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(screen)}
                                data-testid={`button-edit-${screen.id}`}
                                title="Edit Screen"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(screen)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${screen.id}`}
                                title="Delete Screen"
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
        )}

        {/* Screen Modal */}
        <ScreenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screen={editingScreen}
          projectId={selectedProjectId ? parseInt(selectedProjectId) : undefined}
        />
      </div>
    </div>
  );
}

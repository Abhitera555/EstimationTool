import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Tv, Plus, Edit, Trash2, Search, Power, PowerOff } from "lucide-react";
import ScreenModal from "@/components/modals/screen-modal";
import type { Screen } from "@shared/schema";

interface ScreenWithProject extends Screen {
  projectName?: string;
  isActive: boolean;
}

export default function Screens() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
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

  const { data: screens, isLoading: screensLoading, error } = useQuery<ScreenWithProject[]>({
    queryKey: ["/api/screens"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/screens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screens"] });
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

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/screens/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screens"] });
      toast({
        title: "Success",
        description: "Screen status updated successfully",
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
        description: "Failed to update screen status",
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
    setEditingScreen(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = (screen: ScreenWithProject) => {
    toggleActiveMutation.mutate({ 
      id: screen.id, 
      isActive: !screen.isActive 
    });
  };

  const filteredScreens = screens?.filter(screen => 
    screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (screen.description && screen.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (screen.projectName && screen.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (isLoading) {
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                <Tv className="h-8 w-8 text-white" />
              </div>
              Screen Master
            </h1>
            <p className="text-slate-600 text-lg">Manage all screens across projects with active/inactive status</p>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-lg font-medium shadow-lg"
            data-testid="button-add-screen"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Screen
          </Button>
        </div>

        {/* Screens List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl font-semibold text-slate-800">All Screens</CardTitle>
              <div className="w-full sm:w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search screens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-slate-200 pl-10"
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Screen Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScreens.map((screen) => (
                    <TableRow key={screen.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <strong data-testid={`text-screen-name-${screen.id}`}>
                          {screen.name}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {screen.projectName || 'Unknown Project'}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-screen-description-${screen.id}`}>
                        {screen.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={screen.isActive ? "default" : "secondary"}
                          className={screen.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                        >
                          {screen.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-screen-date-${screen.id}`}>
                        {new Date(screen.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
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
                            onClick={() => handleToggleActive(screen)}
                            disabled={toggleActiveMutation.isPending}
                            data-testid={`button-toggle-${screen.id}`}
                            title={screen.isActive ? "Deactivate" : "Activate"}
                          >
                            {screen.isActive ? 
                              <PowerOff className="h-4 w-4 text-red-600" /> : 
                              <Power className="h-4 w-4 text-green-600" />
                            }
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Screen Modal */}
        <ScreenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screen={editingScreen}
        />
      </div>
    </div>
  );
}
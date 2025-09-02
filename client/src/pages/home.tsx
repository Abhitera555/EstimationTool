import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  FolderOpen, 
  Tv, 
  Clock, 
  ListChecks, 
  Eye, 
  Download,
  Plus 
} from "lucide-react";
import ProjectHoursChart from "@/components/charts/project-hours-chart";
import ScreenTypeChart from "@/components/charts/screen-type-chart";
import type { DashboardStats, EstimationWithDetails } from "@/lib/types";

export default function Home() {
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentEstimations, isLoading: estimationsLoading } = useQuery<EstimationWithDetails[]>({
    queryKey: ["/api/estimations"],
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleViewEstimation = (id: number) => {
    // Navigate to estimation details (placeholder)
    toast({
      title: "View Estimation",
      description: `Viewing estimation ${id}`,
    });
  };

  const handleExportEstimation = (id: number) => {
    toast({
      title: "Export Started",
      description: "Estimation export has been initiated",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            Dashboard Overview
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FolderOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold" data-testid="text-total-projects">
                {stats?.totalProjects || 0}
              </div>
              <p className="text-muted-foreground">Total Projects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Tv className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold" data-testid="text-total-screens">
                {stats?.totalScreens || 0}
              </div>
              <p className="text-muted-foreground">Total Screens</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-600 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold" data-testid="text-total-hours">
                {stats?.totalHours || 0}
              </div>
              <p className="text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <ListChecks className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold" data-testid="text-total-estimations">
                {stats?.totalEstimations || 0}
              </div>
              <p className="text-muted-foreground">Estimations</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-blue-600 rounded"></div>
                  Project Estimation Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ProjectHoursChart />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-blue-600 rounded-full"></div>
                  Screen Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ScreenTypeChart />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Estimations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Estimations
            </CardTitle>
            <Link href="/estimations">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" data-testid="button-new-estimation">
                <Plus className="h-4 w-4 mr-1" />
                New Estimation
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {estimationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : recentEstimations && recentEstimations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Project</th>
                      <th className="text-left p-3 font-semibold">Version</th>
                      <th className="text-left p-3 font-semibold">Total Hours</th>
                      <th className="text-left p-3 font-semibold">Created By</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEstimations.slice(0, 5).map((estimation) => (
                      <tr key={estimation.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <strong data-testid={`text-project-${estimation.id}`}>
                            {estimation.projectName}
                          </strong>
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium" data-testid={`text-version-${estimation.id}`}>
                            {estimation.versionNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold" data-testid={`text-hours-${estimation.id}`}>
                            {estimation.totalHours} hrs
                          </span>
                        </td>
                        <td className="p-3" data-testid={`text-creator-${estimation.id}`}>
                          {estimation.creatorName}
                        </td>
                        <td className="p-3" data-testid={`text-date-${estimation.id}`}>
                          {new Date(estimation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEstimation(estimation.id)}
                              data-testid={`button-view-${estimation.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportEstimation(estimation.id)}
                              data-testid={`button-export-${estimation.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No estimations found</p>
                <p className="text-sm">Create your first estimation to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

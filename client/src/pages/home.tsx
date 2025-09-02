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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <ListChecks className="h-8 w-8 text-white" />
            </div>
            Dashboard Overview
          </h1>
          <p className="text-slate-600 text-lg">Track your project estimations and performance metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1" data-testid="text-total-projects">
                {stats?.totalProjects || 0}
              </div>
              <p className="text-slate-600">Total Projects</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1" data-testid="text-total-screens">
                {stats?.totalScreens || 0}
              </div>
              <p className="text-slate-600">Total Screens</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1" data-testid="text-total-hours">
                {stats?.totalHours || 0}
              </div>
              <p className="text-slate-600">Total Hours</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ListChecks className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1" data-testid="text-total-estimations">
                {stats?.totalEstimations || 0}
              </div>
              <p className="text-slate-600">Estimations</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
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
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
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
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <Clock className="h-6 w-6" />
              Recent Estimations
            </CardTitle>
            <Link href="/estimations">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-medium" data-testid="button-new-estimation">
                <Plus className="h-4 w-4 mr-2" />
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

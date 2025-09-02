import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";
import { History, Eye, Copy, Download, FileSpreadsheet, FileText, X } from "lucide-react";
import type { EstimationWithDetails, Project } from "@/lib/types";

export default function HistoryPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

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

  const { data: estimations, isLoading: estimationsLoading, error } = useQuery<EstimationWithDetails[]>({
    queryKey: ["/api/estimations"],
    retry: false,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: false,
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

  const handleViewDetails = (estimation: EstimationWithDetails) => {
    toast({
      title: "View Details",
      description: `Viewing details for ${estimation.name}`,
    });
  };

  const handleCloneEstimation = (estimation: EstimationWithDetails) => {
    toast({
      title: "Clone Estimation",
      description: `Cloning estimation: ${estimation.name}`,
    });
  };

  const handleExportSingle = (estimation: EstimationWithDetails) => {
    toast({
      title: "Export Started",
      description: `Exporting estimation: ${estimation.name}`,
    });
  };

  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: "Excel export has been initiated",
    });
  };

  const handleExportToPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export has been initiated",
    });
  };

  const handleClearFilters = () => {
    setProjectFilter("");
    setDateFromFilter("");
    setDateToFilter("");
  };

  // Filter estimations based on selected filters
  const filteredEstimations = estimations?.filter(estimation => {
    let matches = true;
    
    if (projectFilter && estimation.projectId.toString() !== projectFilter) {
      matches = false;
    }
    
    if (dateFromFilter) {
      const estimationDate = new Date(estimation.createdAt);
      const fromDate = new Date(dateFromFilter);
      if (estimationDate < fromDate) {
        matches = false;
      }
    }
    
    if (dateToFilter) {
      const estimationDate = new Date(estimation.createdAt);
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (estimationDate > toDate) {
        matches = false;
      }
    }
    
    return matches;
  }) || [];

  if (isLoading || estimationsLoading || projectsLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <History className="h-8 w-8" />
            Estimation History
          </h1>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger data-testid="select-filter-project">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Projects</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  data-testid="input-filter-date-from"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  data-testid="input-filter-date-to"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Estimation History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToPDF}
                data-testid="button-export-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEstimations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No estimations found</p>
                <p className="text-sm">
                  {estimations?.length === 0 
                    ? "Create your first estimation to see history" 
                    : "Try adjusting your filters"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Project</th>
                      <th className="text-left p-3 font-semibold">Estimation Name</th>
                      <th className="text-left p-3 font-semibold">Version</th>
                      <th className="text-left p-3 font-semibold">Total Hours</th>
                      <th className="text-left p-3 font-semibold">Created By</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstimations.map((estimation) => (
                      <tr key={estimation.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <strong data-testid={`text-project-${estimation.id}`}>
                            {estimation.projectName}
                          </strong>
                        </td>
                        <td className="p-3" data-testid={`text-estimation-name-${estimation.id}`}>
                          {estimation.name}
                        </td>
                        <td className="p-3">
                          <Badge 
                            className="bg-blue-100 text-blue-800"
                            data-testid={`badge-version-${estimation.id}`}
                          >
                            {estimation.versionNumber}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-green-600" data-testid={`text-total-hours-${estimation.id}`}>
                            {estimation.totalHours} hrs
                          </span>
                        </td>
                        <td className="p-3" data-testid={`text-creator-${estimation.id}`}>
                          {estimation.creatorName}
                        </td>
                        <td className="p-3" data-testid={`text-created-date-${estimation.id}`}>
                          {new Date(estimation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(estimation)}
                              data-testid={`button-view-details-${estimation.id}`}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloneEstimation(estimation)}
                              data-testid={`button-clone-${estimation.id}`}
                              title="Clone"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportSingle(estimation)}
                              data-testid={`button-export-single-${estimation.id}`}
                              title="Export"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

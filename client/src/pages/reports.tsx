import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  BarChart3,
  Eye,
  Printer
} from "lucide-react";
import { format } from "date-fns";

interface EstimationDetail {
  id: number;
  estimationId: number;
  screenId: number;
  screenName: string;
  complexity: string;
  screenType: string;
  hours: number;
}

interface EstimationReport {
  id: number;
  name: string;
  projectName: string;
  versionNumber: string;
  totalHours: number;
  createdAt: string;
  details: EstimationDetail[];
}

export default function Reports() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [complexityFilter, setComplexityFilter] = useState("all");
  const [selectedEstimation, setSelectedEstimation] = useState<EstimationReport | null>(null);

  // Fetch estimations with details
  const { data: estimations, isLoading: estimationsLoading } = useQuery<EstimationReport[]>({
    queryKey: ["/api/estimations/detailed"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Get unique projects for filtering
  const projects = useMemo(() => {
    if (!estimations) return [];
    const uniqueProjects = [...new Set(estimations.map(e => e.projectName))];
    return uniqueProjects;
  }, [estimations]);

  // Get unique complexities for filtering
  const complexities = useMemo(() => {
    if (!estimations) return [];
    const allComplexities = estimations.flatMap(e => e.details.map(d => d.complexity));
    return [...new Set(allComplexities)];
  }, [estimations]);

  // Filter estimations based on search and filters
  const filteredEstimations = useMemo(() => {
    if (!estimations) return [];
    
    return estimations.filter(estimation => {
      const matchesSearch = estimation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           estimation.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProject = projectFilter === "all" || estimation.projectName === projectFilter;
      
      const matchesComplexity = complexityFilter === "all" || 
                               estimation.details.some(d => d.complexity === complexityFilter);
      
      return matchesSearch && matchesProject && matchesComplexity;
    });
  }, [estimations, searchTerm, projectFilter, complexityFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredEstimations.length) return null;
    
    const totalEstimations = filteredEstimations.length;
    const totalHours = filteredEstimations.reduce((sum, e) => sum + e.totalHours, 0);
    const avgHours = Math.round(totalHours / totalEstimations);
    const totalScreens = filteredEstimations.reduce((sum, e) => sum + e.details.length, 0);
    
    return { totalEstimations, totalHours, avgHours, totalScreens };
  }, [filteredEstimations]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!filteredEstimations.length) return;
    
    const csvHeaders = ["Estimation Name", "Project", "Version", "Total Hours", "Created Date", "Screen Name", "Complexity", "Screen Type", "Hours"];
    const csvData = filteredEstimations.flatMap(estimation => 
      estimation.details.map(detail => [
        estimation.name,
        estimation.projectName,
        estimation.versionNumber,
        estimation.totalHours,
        format(new Date(estimation.createdAt), "dd/MM/yyyy"),
        detail.screenName,
        detail.complexity,
        detail.screenType,
        detail.hours
      ])
    );
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estimation-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || estimationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="h-8 bg-white/60 rounded-lg mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 print:bg-white print:p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              <FileText className="inline h-8 w-8 mr-3 text-blue-600" />
              Estimation Reports
            </h1>
            <p className="text-slate-600">Detailed analysis and insights of all project estimations</p>
          </div>
          <div className="flex gap-3 print:hidden">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Estimations</p>
                    <p className="text-3xl font-bold">{summaryStats.totalEstimations}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Hours</p>
                    <p className="text-3xl font-bold">{summaryStats.totalHours}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Average Hours</p>
                    <p className="text-3xl font-bold">{summaryStats.avgHours}h</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Screens</p>
                    <p className="text-3xl font-bold">{summaryStats.totalScreens}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-8 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search estimations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-estimations"
                />
              </div>
              
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger data-testid="filter-project">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={complexityFilter} onValueChange={setComplexityFilter}>
                <SelectTrigger data-testid="filter-complexity">
                  <SelectValue placeholder="Filter by Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complexities</SelectItem>
                  {complexities.map(complexity => (
                    <SelectItem key={complexity} value={complexity}>{complexity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setProjectFilter("all");
                  setComplexityFilter("all");
                }}
                className="gap-2"
                data-testid="clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estimations Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Estimation Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimation Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Screens</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimations.map((estimation) => (
                  <TableRow key={estimation.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium">{estimation.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{estimation.projectName}</Badge>
                    </TableCell>
                    <TableCell>{estimation.versionNumber}</TableCell>
                    <TableCell className="text-right font-bold">{estimation.totalHours}h</TableCell>
                    <TableCell className="text-right">{estimation.details.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(estimation.createdAt), "dd/MM/yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="print:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEstimation(estimation)}
                        className="gap-2"
                        data-testid={`view-estimation-${estimation.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredEstimations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No estimations found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed View Modal/Section */}
        {selectedEstimation && (
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-between">
                <span>Detailed Breakdown: {selectedEstimation.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedEstimation(null)}
                  className="print:hidden"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600">Project</p>
                  <p className="font-semibold">{selectedEstimation.projectName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Version</p>
                  <p className="font-semibold">{selectedEstimation.versionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Hours</p>
                  <p className="font-semibold text-2xl text-blue-600">{selectedEstimation.totalHours}h</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Screen Name</TableHead>
                    <TableHead>Complexity</TableHead>
                    <TableHead>Screen Type</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEstimation.details.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">{detail.screenName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={detail.complexity === 'Complex' ? 'destructive' : 
                                 detail.complexity === 'Medium' ? 'default' : 'secondary'}
                        >
                          {detail.complexity}
                        </Badge>
                      </TableCell>
                      <TableCell>{detail.screenType}</TableCell>
                      <TableCell className="text-right font-bold">{detail.hours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectHoursData } from "@/lib/types";

export default function ProjectHoursChart() {
  const { toast } = useToast();

  const { data: projectHours, isLoading, error } = useQuery<ProjectHoursData[]>({
    queryKey: ["/api/dashboard/project-hours"],
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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!projectHours || projectHours.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No project data available</p>
          <p className="text-sm">Create some estimations to see chart data</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={projectHours} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="projectName" 
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis className="text-xs" />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Bar 
          dataKey="totalHours" 
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="Hours"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from "lucide-react";
import type { ProjectHoursData } from "@/lib/types";
import { calculateEstimatedDays, formatDays } from "@/lib/estimation-engine";

const GRADIENT_COLORS = [
  { start: '#3B82F6', end: '#8B5CF6' }, // Blue to Purple
  { start: '#10B981', end: '#3B82F6' }, // Green to Blue
  { start: '#F59E0B', end: '#EF4444' }, // Amber to Red
  { start: '#8B5CF6', end: '#EC4899' }, // Purple to Pink
  { start: '#06B6D4', end: '#10B981' }, // Cyan to Green
  { start: '#F97316', end: '#F59E0B' }, // Orange to Amber
];

type ChartType = 'bar' | 'line' | 'area';

export default function ProjectHoursChart() {
  const { toast } = useToast();
  const [chartType, setChartType] = useState<ChartType>('bar');

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
        <div className="animate-pulse space-y-4">
          <div className="flex gap-2 justify-center">
            <div className="h-8 w-24 bg-muted rounded"></div>
            <div className="h-8 w-24 bg-muted rounded"></div>
            <div className="h-8 w-24 bg-muted rounded"></div>
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!projectHours || projectHours.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No project data available</p>
          <p className="text-sm">Create some estimations to see beautiful charts</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const days = calculateEstimatedDays(value);
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg p-4">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: payload[0].color }}
            ></div>
            <span className="text-sm text-slate-600">
              Total Days: <span className="font-bold text-lg">{formatDays(days)} days</span>
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ({value} hours)
          </div>
          <p className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-100 inline-block mt-2">
            {value > 100 ? '🚀 Large Project' : 
             value > 50 ? '📊 Medium Project' : '⚡ Small Project'}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: projectHours,
      margin: { top: 20, right: 30, left: 20, bottom: 80 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="projectName" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#CBD5E1' }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone"
              dataKey="totalHours" 
              stroke="#3B82F6"
              strokeWidth={4}
              dot={{ fill: '#3B82F6', strokeWidth: 3, r: 8, stroke: '#fff' }}
              activeDot={{ r: 10, fill: '#8B5CF6', strokeWidth: 3, stroke: '#fff' }}
              name="Days"
            />
          </LineChart>
        );
        
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="projectName" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#CBD5E1' }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone"
              dataKey="totalHours" 
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#areaGradient)"
              name="Days"
            />
          </AreaChart>
        );
        
      default: // bar
        return (
          <BarChart {...commonProps}>
            <defs>
              {projectHours?.map((_, index) => (
                <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length].start} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length].end} stopOpacity={0.7}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
            <XAxis 
              dataKey="projectName" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#CBD5E1' }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="totalHours" 
              radius={[8, 8, 0, 0]}
              name="Days"
            >
              {projectHours?.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#barGradient${index})`} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {/* Chart Type Selector */}
      <div className="flex gap-2 mb-4 justify-center">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
          className={chartType === 'bar' ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="chart-type-bar"
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Bar Chart
        </Button>
        <Button
          variant={chartType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('line')}
          className={chartType === 'line' ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="chart-type-line"
        >
          <LineChartIcon className="h-4 w-4 mr-1" />
          Line Chart
        </Button>
        <Button
          variant={chartType === 'area' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('area')}
          className={chartType === 'area' ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="chart-type-area"
        >
          <AreaChartIcon className="h-4 w-4 mr-1" />
          Area Chart
        </Button>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height="85%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import type { ScreenTypeDistribution } from "@/lib/types";

const BEAUTIFUL_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

const GRADIENT_COLORS = [
  { start: '#3B82F6', end: '#1E40AF' }, // Blue gradient
  { start: '#10B981', end: '#047857' }, // Emerald gradient
  { start: '#F59E0B', end: '#D97706' }, // Amber gradient
  { start: '#EF4444', end: '#DC2626' }, // Red gradient
  { start: '#8B5CF6', end: '#7C3AED' }, // Purple gradient
  { start: '#06B6D4', end: '#0891B2' }, // Cyan gradient
];

type ChartType = 'pie' | 'bar';

export default function ScreenTypeChart() {
  const { toast } = useToast();
  const [chartType, setChartType] = useState<ChartType>('pie');

  const { data: screenTypeData, isLoading, error } = useQuery<ScreenTypeDistribution[]>({
    queryKey: ["/api/dashboard/screen-type-distribution"],
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
            <div className="h-8 w-20 bg-muted rounded"></div>
            <div className="h-8 w-20 bg-muted rounded"></div>
          </div>
          <div className="h-64 bg-muted rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!screenTypeData || screenTypeData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <PieChartIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No screen type data available</p>
          <p className="text-sm">Create some estimations to see distribution</p>
        </div>
      </div>
    );
  }

  const chartData = screenTypeData.map((item) => ({
    name: item.screenTypeName,
    value: item.count,
  }));

  const totalScreens = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalScreens) * 100).toFixed(1);
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg p-4">
          <p className="font-semibold text-slate-800 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Count: <span className="font-bold text-lg">{data.value}</span>
            </p>
            <p className="text-sm text-slate-600">
              Percentage: <span className="font-bold">{percentage}%</span>
            </p>
          </div>
          <div className="mt-2 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-500 inline-block">
            {data.value === 1 ? '📱 Single screen' : `📱 ${data.value} screens`}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600 font-medium">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <PieChart>
          <defs>
            {chartData.map((_, index) => (
              <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={BEAUTIFUL_COLORS[index % BEAUTIFUL_COLORS.length]} stopOpacity={1}/>
                <stop offset="100%" stopColor={BEAUTIFUL_COLORS[index % BEAUTIFUL_COLORS.length]} stopOpacity={0.8}/>
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={35}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient${index})`}
                stroke="#fff"
                strokeWidth={3}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      );
    } else {
      return (
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            {chartData.map((_, index) => (
              <linearGradient key={index} id={`barGradientScreen${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length].start} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length].end} stopOpacity={0.7}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#CBD5E1' }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]}
            name="Screen Count"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#barGradientScreen${index})`} />
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
          variant={chartType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('pie')}
          className={chartType === 'pie' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="chart-type-pie"
        >
          <PieChartIcon className="h-4 w-4 mr-1" />
          Pie Chart
        </Button>
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
          className={chartType === 'bar' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="chart-type-bar"
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Bar Chart
        </Button>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height="75%">
        {renderChart()}
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="text-center mt-2">
        <p className="text-sm text-slate-600">
          Total: <span className="font-bold">{totalScreens}</span> screens across{' '}
          <span className="font-bold">{chartData.length}</span> types
        </p>
      </div>
    </div>
  );
}
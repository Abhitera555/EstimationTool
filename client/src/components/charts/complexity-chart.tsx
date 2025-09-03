import { useQuery } from "@tanstack/react-query";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, Target } from "lucide-react";

const COMPLEXITY_COLORS = [
  { name: 'Simple', color: '#10B981', lightColor: '#6EE7B7' }, // Green
  { name: 'Medium', color: '#F59E0B', lightColor: '#FCD34D' }, // Amber
  { name: 'Complex', color: '#EF4444', lightColor: '#FCA5A5' }, // Red
];

type ChartType = 'pie' | 'radial';

interface ComplexityData {
  complexityName: string;
  count: number;
  totalHours: number;
}

export default function ComplexityChart() {
  const { toast } = useToast();
  const [chartType, setChartType] = useState<ChartType>('pie');

  const { data: complexityData, isLoading, error } = useQuery<ComplexityData[]>({
    queryKey: ["/api/dashboard/complexity-distribution"],
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

  if (!complexityData || complexityData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No complexity data available</p>
          <p className="text-sm">Create some estimations to see complexity breakdown</p>
        </div>
      </div>
    );
  }

  const chartData = complexityData.map((item) => {
    const colorConfig = COMPLEXITY_COLORS.find(c => c.name === item.complexityName) || COMPLEXITY_COLORS[0];
    return {
      name: item.complexityName,
      value: item.count,
      hours: item.totalHours,
      color: colorConfig.color,
      lightColor: colorConfig.lightColor,
      fill: colorConfig.color,
    };
  });

  const totalItems = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalItems) * 100).toFixed(1);
      const hoursPercentage = ((data.hours / totalHours) * 100).toFixed(1);
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg p-4">
          <p className="font-semibold text-slate-800 mb-2">{data.name} Complexity</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Count: <span className="font-bold text-lg">{data.value}</span> ({percentage}%)
            </p>
            <p className="text-sm text-slate-600">
              Hours: <span className="font-bold text-lg">{data.hours}</span> ({hoursPercentage}%)
            </p>
            <p className="text-sm text-slate-600">
              Avg: <span className="font-bold">{(data.hours / data.value).toFixed(1)}</span> hrs/item
            </p>
          </div>
          <div className="mt-2 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-500 inline-block">
            {data.name === 'Simple' ? '⚡ Quick tasks' : 
             data.name === 'Medium' ? '📊 Standard work' : '🚀 Complex features'}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
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
    if (chartType === 'radial') {
      return (
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="25%"
          outerRadius="75%"
          data={chartData}
        >
          <RadialBar
            label={{ position: 'insideStart', fill: '#fff' }}
            background={{ fill: '#F1F5F9' }}
            dataKey="value"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </RadialBarChart>
      );
    } else {
      return (
        <PieChart>
          <defs>
            {chartData.map((item, index) => (
              <linearGradient key={index} id={`complexityGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={1}/>
                <stop offset="100%" stopColor={item.lightColor} stopOpacity={0.8}/>
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
                fill={`url(#complexityGradient${index})`}
                stroke="#fff"
                strokeWidth={3}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
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
          className={chartType === 'pie' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="complexity-chart-type-pie"
        >
          <PieChartIcon className="h-4 w-4 mr-1" />
          Donut Chart
        </Button>
        <Button
          variant={chartType === 'radial' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('radial')}
          className={chartType === 'radial' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'hover:bg-slate-50'}
          data-testid="complexity-chart-type-radial"
        >
          <Target className="h-4 w-4 mr-1" />
          Radial Chart
        </Button>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height="75%">
        {renderChart()}
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="text-center mt-2">
        <p className="text-sm text-slate-600">
          Total: <span className="font-bold">{totalItems}</span> items, <span className="font-bold">{totalHours}</span> hours
        </p>
      </div>
    </div>
  );
}
export interface DashboardStats {
  totalProjects: number;
  totalScreens: number;
  totalEstimations: number;
  totalHours: number;
}

export interface ProjectHoursData {
  projectName: string;
  totalHours: number;
}

export interface ScreenTypeDistribution {
  screenTypeName: string;
  count: number;
}

export interface EstimationFormData {
  projectId: number;
  name: string;
  versionNumber: string;
  notes?: string;
  screens: EstimationScreenData[];
}

export interface EstimationScreenData {
  screenId: number;
  complexityId: number;
  screenTypeId: number;
  calculatedHours: number;
}

export interface EstimationWithDetails {
  id: number;
  name: string;
  totalHours: number;
  versionNumber: string;
  notes?: string;
  createdAt: string;
  projectId: number;
  projectName: string;
  createdBy: string;
  creatorName: string;
  details?: EstimationDetailWithNames[];
}

export interface EstimationDetailWithNames {
  id: number;
  screenId: number;
  screenName: string;
  complexityId: number;
  complexityName: string;
  complexityHours: number;
  screenTypeId: number;
  screenTypeName: string;
  screenTypeHours: number;
  calculatedHours: number;
}

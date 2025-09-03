import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  BarChart3,
  Plus,
  History,
  FolderOpen,
  Tv,
  Sliders,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  LogOut,
  Settings,
  FileText,
} from "lucide-react";
import logoImage from "@assets/logo-2_1756874854818.jpg";

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Create Estimation", href: "/estimations", icon: Plus },
  { name: "History", href: "/history", icon: History },
];

const mastersSubNavigation = [
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Screens", href: "/screens", icon: Tv },
  { name: "Complexity", href: "/complexity", icon: Sliders },
  { name: "Screen Types", href: "/screen-types", icon: Monitor },
];

const reportsNavigation = [
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mastersExpanded, setMastersExpanded] = useState(false);
  
  // Force refresh user data once on mount to get latest role
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, []);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const canAccessMasters = (user as any)?.role === "admin" || (user as any)?.role === "estimator";
  
  // Check if any masters route is active
  const isMastersRouteActive = mastersSubNavigation.some(item => location === item.href);
  
  // Auto-expand masters if on a masters route
  if (isMastersRouteActive && !mastersExpanded) {
    setMastersExpanded(true);
  }

  const NavItem = ({ item }: { item: any }) => {
    const isActive = location === item.href;
    return (
      <Link href={item.href}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className={`w-full justify-start gap-3 h-11 ${
            isActive 
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          } ${isCollapsed ? "px-2" : "px-4"}`}
          data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <item.icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
          {!isCollapsed && <span className="font-medium">{item.name}</span>}
        </Button>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className={`${isCollapsed ? "w-16" : "w-64"} bg-white border-r border-slate-200 shadow-lg transition-all duration-300`}>
        <div className="p-4">
          <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? "w-16" : "w-64"} bg-white border-r border-slate-200 shadow-lg transition-all duration-300 flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm">
                <img 
                  src={logoImage} 
                  alt="Revalsys Logo" 
                  className="w-full h-full object-contain p-0.5" 
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">EstimateFlow</h1>
                <p className="text-xs text-slate-500">Project Estimation</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm mx-auto">
              <img 
                src={logoImage} 
                alt="Revalsys Logo" 
                className="w-full h-full object-contain p-0.5" 
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 hover:text-slate-700"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Main
            </h2>
          )}
          {mainNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        {/* Masters Navigation */}
        {canAccessMasters && (
          <>
            <Separator />
            <div className="space-y-2">
              {/* Masters Toggle Button */}
              <Button
                variant="ghost"
                onClick={() => setMastersExpanded(!mastersExpanded)}
                className={`w-full justify-start gap-3 h-11 text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${
                  isMastersRouteActive ? "bg-slate-100" : ""
                } ${isCollapsed ? "px-2" : "px-4"}`}
                data-testid="nav-masters-toggle"
              >
                <Settings className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">Masters</span>
                    {mastersExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </>
                )}
              </Button>
              
              {/* Masters Submenu */}
              {mastersExpanded && !isCollapsed && (
                <div className="ml-8 space-y-1">
                  {mastersSubNavigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-9 text-sm ${
                          location === item.href
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Reports Navigation */}
        <Separator />
        <div className="space-y-2">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Reports
            </h2>
          )}
          {reportsNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                </p>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  {(user as any)?.role?.charAt(0).toUpperCase() + (user as any)?.role?.slice(1) || 'Viewer'}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="nav-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <User className="h-4 w-4 text-white" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="nav-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
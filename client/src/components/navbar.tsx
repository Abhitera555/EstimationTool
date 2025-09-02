import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Calculator,
  BarChart3,
  Settings,
  FolderOpen,
  Tv,
  Sliders,
  Monitor,
  Plus,
  History,
  User,
  LogOut,
  Menu,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Create Estimation", href: "/estimations", icon: Plus },
  { name: "History", href: "/history", icon: History },
];

const mastersNavigation = [
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Screens", href: "/screens", icon: Tv },
  { name: "Complexity", href: "/complexity", icon: Sliders },
  { name: "Screen Types", href: "/screen-types", icon: Monitor },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const canAccessMasters = user?.role === "admin" || user?.role === "estimator";

  const NavLink = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
    const isActive = location === item.href;
    return (
      <Link href={item.href}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className={`${mobile ? "w-full justify-start" : ""} ${
            isActive 
              ? "bg-white/20 text-white backdrop-blur-sm" 
              : "text-white/90 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => mobile && setMobileMenuOpen(false)}
          data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {item.name}
        </Button>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">EstimateFlow</span>
                <p className="text-xs text-slate-300">Project Estimation</p>
              </div>
            </div>
            <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group" data-testid="nav-logo">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl group-hover:shadow-lg transition-all">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">EstimateFlow</span>
                <p className="text-xs text-slate-300">Project Estimation</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}

            {canAccessMasters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white/90 hover:bg-white/10 hover:text-white" data-testid="nav-masters-dropdown">
                    <Settings className="h-4 w-4 mr-2" />
                    Masters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border-slate-200">
                  {mastersNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center w-full hover:bg-slate-50" data-testid={`dropdown-${item.name.toLowerCase()}`}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white/90 hover:bg-white/10 hover:text-white" data-testid="nav-user-menu">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Viewer'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border-slate-200">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email
                      }
                    </span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 text-red-600" data-testid="nav-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10 hover:text-white" data-testid="nav-mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 bg-white/95 backdrop-blur-md">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <NavLink key={item.name} item={item} mobile />
                    ))}
                    
                    {canAccessMasters && (
                      <>
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-slate-600 mb-2 px-2">Masters</p>
                          {mastersNavigation.map((item) => (
                            <NavLink key={item.name} item={item} mobile />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

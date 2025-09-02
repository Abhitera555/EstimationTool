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
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" 
              : "text-white hover:bg-white/20"
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
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Estimation Tool</span>
            </div>
            <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer" data-testid="nav-logo">
              <Calculator className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Estimation Tool</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}

            {canAccessMasters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="nav-masters-dropdown">
                    <Settings className="h-4 w-4 mr-2" />
                    Masters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {mastersNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center w-full" data-testid={`dropdown-${item.name.toLowerCase()}`}>
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
                <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="nav-user-menu">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="ml-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Viewer'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" data-testid="nav-mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <NavLink key={item.name} item={item} mobile />
                    ))}
                    
                    {canAccessMasters && (
                      <>
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2 px-2">Masters</p>
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

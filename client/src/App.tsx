import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import Screens from "@/pages/screens";
import Complexity from "@/pages/complexity";
import ScreenTypes from "@/pages/screen-types";
import Estimations from "@/pages/estimations-simple";
import History from "@/pages/history";
import Reports from "@/pages/reports";
import HourMapping from "@/pages/hour-mapping";
import Sidebar from "@/components/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/" component={AuthPage} />
          <Route path="/landing" component={Landing} />
          <Route component={AuthPage} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/projects" component={Projects} />
          <Route path="/screens" component={Screens} />
          <Route path="/complexity" component={Complexity} />
          <Route path="/screen-types" component={ScreenTypes} />
          <Route path="/hour-mapping" component={HourMapping} />
          <Route path="/estimations" component={Estimations} />
          <Route path="/history" component={History} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

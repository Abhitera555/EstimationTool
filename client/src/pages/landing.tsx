import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Layers, ClipboardList, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">EstimateFlow</h1>
                <p className="text-xs text-slate-500">Project Estimation Made Simple</p>
              </div>
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-medium"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            Fast & Accurate Estimations
          </div>
          <h2 className="text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Project Estimation<br />Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Simple</span>
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create accurate project estimates in minutes. Select your project, configure screens with complexity levels, and get instant calculations.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            data-testid="button-get-started"
          >
            Start Estimating
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold">Project Management</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600">
                Organize projects and screens with intuitive management interface.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold">Smart Estimation</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600">
                Configure complexity levels and screen types for accurate hour calculations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold">Instant Results</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-600">
                Get immediate estimation results with breakdown by complexity and type.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto border-0 shadow-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white overflow-hidden">
            <CardContent className="p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative">
                <h3 className="text-4xl font-bold mb-4">Ready to Start?</h3>
                <p className="text-xl mb-8 text-slate-300">
                  Join teams already using EstimateFlow for accurate project estimations.
                </p>
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-white text-slate-800 hover:bg-slate-100 px-8 py-4 rounded-xl font-semibold shadow-lg"
                  data-testid="button-signin-cta"
                >
                  Get Started Free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

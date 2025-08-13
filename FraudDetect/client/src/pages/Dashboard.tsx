import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Brain,
  Database,
  Target,
  TrendingUp,
  Upload,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/models"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const quickActions = [
    {
      title: "Upload Dataset",
      href: "/dataset",
      icon: Upload,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-primary",
    },
    {
      title: "Train Model", 
      href: "/training",
      icon: Brain,
      color: "bg-green-50 hover:bg-green-100 border-green-200 text-secondary",
    },
    {
      title: "View Results",
      href: "/results", 
      icon: BarChart3,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600",
    },
  ];

  const modelColumns = [
    {
      key: "name" as const,
      label: "Model Name",
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: "algorithm" as const,
      label: "Algorithm",
      render: (value: string) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === "completed" ? "default" : value === "training" ? "secondary" : "destructive"}>
          {value}
        </Badge>
      )
    },
    {
      key: "accuracy" as const,
      label: "Accuracy",
      render: (value: number) => value ? `${(value * 100).toFixed(1)}%` : "-"
    },
    {
      key: "createdAt" as const,
      label: "Created",
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
          Fraud Detection Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor your machine learning models and recent training activities
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Models</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-active-models">
                  {statsLoading ? "..." : stats?.activeModels || 0}
                </p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Datasets</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-datasets">
                  {statsLoading ? "..." : stats?.datasets || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-accuracy">
                  {statsLoading ? "..." : stats?.accuracy ? `${(stats.accuracy * 100).toFixed(1)}%` : "0%"}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Predictions Today</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-predictions">
                  {statsLoading ? "..." : stats?.predictions || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant="outline"
                    className={`w-full h-auto p-4 ${action.color} transition-colors`}
                    data-testid={`button-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-3" size={20} />
                    <span className="font-medium">{action.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Models Table */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Models</h2>
        </div>
        <DataTable
          data={(models || []).slice(0, 5)}
          columns={modelColumns}
          isLoading={modelsLoading}
          emptyMessage="No models found. Create your first model to get started."
        />
      </div>
    </div>
  );
}

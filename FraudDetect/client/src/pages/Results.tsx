import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Target, Crosshair, Search, Scale, Download, Eye } from "lucide-react";

export default function Results() {
  const [selectedModel, setSelectedModel] = useState("");
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

  const { data: models } = useQuery({
    queryKey: ["/api/models"],
    retry: false,
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/predictions"],
    retry: false,
  });

  const completedModels = (models || []).filter((m: any) => m.status === "completed");
  const currentModel = completedModels.find((m: any) => m.id === selectedModel) || completedModels[0];

  // Mock metrics based on model data
  const metrics = currentModel ? {
    accuracy: currentModel.accuracy || 0.948,
    precision: currentModel.precision || 0.912,
    recall: currentModel.recall || 0.897,
    f1Score: currentModel.f1Score || 0.904,
  } : {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  };

  const predictionColumns = [
    {
      key: "transactionId" as const,
      label: "Transaction ID",
      render: (value: string) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: "amount" as const,
      label: "Amount",
      render: (value: number) => `$${value?.toFixed(2) || "0.00"}`
    },
    {
      key: "prediction" as const,
      label: "Prediction",
      render: (value: string) => (
        <Badge variant={value === "fraud" ? "destructive" : "default"}>
          {value}
        </Badge>
      )
    },
    {
      key: "confidence" as const,
      label: "Confidence",
      render: (value: number) => `${(value * 100).toFixed(1)}%`
    },
    {
      key: "riskScore" as const,
      label: "Risk Score",
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className={`h-2 rounded-full ${value > 0.7 ? "bg-red-500" : value > 0.4 ? "bg-yellow-500" : "bg-green-500"}`}
              style={{ width: `${(value * 100)}%` }}
            />
          </div>
          <span className="text-sm">{value?.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (value: string) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" data-testid={`button-view-details-${value}`}>
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="sm" data-testid={`button-investigate-${value}`}>
            Investigate
          </Button>
        </div>
      )
    }
  ];

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
          Results & Analytics
        </h1>
        <p className="text-gray-600">
          Comprehensive analysis of model performance and predictions
        </p>
      </div>

      {/* Model Selection */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Analysis Dashboard</h2>
              <p className="text-gray-600">Select a model to view detailed performance metrics</p>
            </div>
            <div className="flex space-x-4">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-64" data-testid="select-model">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {completedModels.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.algorithm})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="button-refresh">
                <RefreshCw className="mr-2" size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Accuracy</h3>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900" data-testid="text-accuracy-metric">
              {(metrics.accuracy * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-green-600 mt-1">↑ 2.3% from previous</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Precision</h3>
              <Crosshair className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900" data-testid="text-precision-metric">
              {(metrics.precision * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-blue-600 mt-1">↑ 1.8% from previous</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recall</h3>
              <Search className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900" data-testid="text-recall-metric">
              {(metrics.recall * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-purple-600 mt-1">↑ 3.1% from previous</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">F1 Score</h3>
              <Scale className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900" data-testid="text-f1-metric">
              {(metrics.f1Score * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-orange-600 mt-1">↑ 2.6% from previous</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ROC Curve Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ROC Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 font-medium">ROC Curve Visualization</p>
                <p className="text-sm text-gray-500 mt-2">AUC: 0.94</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confusion Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-600 font-medium">Confusion Matrix Heatmap</p>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="bg-green-100 p-2 rounded">TP: 8,743</div>
                  <div className="bg-red-100 p-2 rounded">FP: 892</div>
                  <div className="bg-red-100 p-2 rounded">FN: 1,024</div>
                  <div className="bg-green-100 p-2 rounded">TN: 89,341</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crosshair className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600 font-medium">Feature Importance Chart</p>
                <div className="text-xs mt-2 space-y-1">
                  <div>1. Transaction Amount (0.23)</div>
                  <div>2. Account Age (0.19)</div>
                  <div>3. Geographic Risk (0.16)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-gray-600 font-medium">Training Progress Chart</p>
                <p className="text-sm text-gray-500 mt-2">Loss: 0.23 • Val Acc: 94.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Prediction Results</h2>
          <div className="flex space-x-2">
            <Button variant="outline" data-testid="button-filter-results">
              Filter
            </Button>
            <Button variant="outline" data-testid="button-export-results">
              <Download className="mr-2" size={16} />
              Export
            </Button>
          </div>
        </div>

        <DataTable
          data={predictions || []}
          columns={predictionColumns}
          isLoading={predictionsLoading}
          emptyMessage="No prediction results found. Run predictions on your models to see results here."
          searchPlaceholder="Search transactions..."
        />
      </div>
    </div>
  );
}

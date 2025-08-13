import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Save, Eye, Trash2, Square } from "lucide-react";

export default function MLTraining() {
  const [algorithm, setAlgorithm] = useState("");
  const [trainingDataset, setTrainingDataset] = useState("");
  const [testDataset, setTestDataset] = useState("");
  const [modelName, setModelName] = useState("");
  const [trainValidationSplit, setTrainValidationSplit] = useState("80_20");
  const [cvFolds, setCvFolds] = useState("5");
  const [maxTrainingTime, setMaxTrainingTime] = useState("2");
  
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: datasets } = useQuery({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/models"],
    retry: false,
  });

  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/training-sessions/active"],
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const createModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      return await apiRequest("POST", "/api/models", modelData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Model training started successfully",
      });
      // Reset form
      setAlgorithm("");
      setTrainingDataset("");
      setTestDataset("");
      setModelName("");
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions/active"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to start model training",
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      return await apiRequest("DELETE", `/api/models/${modelId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    },
  });

  const handleStartTraining = () => {
    if (!algorithm || !trainingDataset || !modelName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createModelMutation.mutate({
      name: modelName,
      algorithm,
      trainingDatasetId: trainingDataset,
      testDatasetId: testDataset || null,
      status: "training",
    });
  };

  const algorithms = [
    { value: "random_forest", label: "Random Forest" },
    { value: "xgboost", label: "XGBoost" },
    { value: "logistic_regression", label: "Logistic Regression" },
    { value: "neural_network", label: "Neural Network" },
    { value: "svm", label: "Support Vector Machine" },
  ];

  const readyDatasets = (datasets || []).filter((d: any) => d.status === "ready");

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
        <Badge variant="secondary">{algorithms.find(a => a.value === value)?.label || value}</Badge>
      )
    },
    {
      key: "trainingTime" as const,
      label: "Training Time",
      render: (value: number) => value ? `${value} min` : "-"
    },
    {
      key: "accuracy" as const,
      label: "Accuracy",
      render: (value: number) => value ? `${(value * 100).toFixed(1)}%` : "-"
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
      key: "id" as const,
      label: "Actions",
      render: (value: string, item: any) => (
        <div className="flex space-x-2">
          {item.status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-deploy-${value}`}
            >
              Deploy
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-view-details-${value}`}
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteModelMutation.mutate(value)}
            disabled={deleteModelMutation.isPending}
            data-testid={`button-delete-model-${value}`}
          >
            <Trash2 size={16} />
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
          Machine Learning Training
        </h1>
        <p className="text-gray-600">
          Configure and train fraud detection models
        </p>
      </div>

      {/* Training Configuration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Training Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="algorithm">Select Algorithm *</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger data-testid="select-algorithm">
                  <SelectValue placeholder="Choose an algorithm..." />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map((algo) => (
                    <SelectItem key={algo.value} value={algo.value}>
                      {algo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="training-dataset">Training Dataset *</Label>
              <Select value={trainingDataset} onValueChange={setTrainingDataset}>
                <SelectTrigger data-testid="select-training-dataset">
                  <SelectValue placeholder="Select training dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {readyDatasets.map((dataset: any) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="test-dataset">Test Dataset</Label>
              <Select value={testDataset} onValueChange={setTestDataset}>
                <SelectTrigger data-testid="select-test-dataset">
                  <SelectValue placeholder="Select test dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {readyDatasets.map((dataset: any) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model-name">Model Name *</Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Enter model name"
                data-testid="input-model-name"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Parameters</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="split">Train/Validation Split</Label>
                <Select value={trainValidationSplit} onValueChange={setTrainValidationSplit}>
                  <SelectTrigger data-testid="select-train-split">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80_20">80% / 20%</SelectItem>
                    <SelectItem value="70_30">70% / 30%</SelectItem>
                    <SelectItem value="90_10">90% / 10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cv-folds">Cross-Validation Folds</Label>
                <Input
                  id="cv-folds"
                  type="number"
                  value={cvFolds}
                  onChange={(e) => setCvFolds(e.target.value)}
                  min="2"
                  max="10"
                  data-testid="input-cv-folds"
                />
              </div>

              <div>
                <Label htmlFor="max-time">Max Training Time (hours)</Label>
                <Input
                  id="max-time"
                  type="number"
                  value={maxTrainingTime}
                  onChange={(e) => setMaxTrainingTime(e.target.value)}
                  min="0.5"
                  max="24"
                  step="0.5"
                  data-testid="input-max-time"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleStartTraining}
              disabled={createModelMutation.isPending}
              className="bg-primary hover:bg-blue-700"
              data-testid="button-start-training"
            >
              <Play className="mr-2" size={16} />
              {createModelMutation.isPending ? "Starting..." : "Start Training"}
            </Button>
            <Button variant="outline" data-testid="button-save-config">
              <Save className="mr-2" size={16} />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Training Sessions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="text-center py-4">Loading active sessions...</div>
          ) : activeSessions?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active training sessions
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions?.map((session: any) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{session.modelName || "Training Session"}</h3>
                      <p className="text-sm text-gray-600">
                        Started {new Date(session.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{session.status}</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress: {session.progress || 0}%</span>
                    <span>ETA: {session.estimatedTimeRemaining || "calculating..."}</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="ghost" size="sm" data-testid={`button-view-logs-${session.id}`}>
                      View Logs
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-stop-training-${session.id}`}>
                      <Square size={16} />
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Training History</h2>
        <DataTable
          data={models || []}
          columns={modelColumns}
          isLoading={modelsLoading}
          emptyMessage="No training history found. Start your first training session to see results here."
          searchPlaceholder="Search models..."
        />
      </div>
    </div>
  );
}

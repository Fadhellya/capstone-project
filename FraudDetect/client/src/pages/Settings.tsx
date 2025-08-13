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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Save, RotateCcw, Download, FolderOpen } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    activeModelId: "",
    defaultTrainingDatasetId: "",
    defaultTestDatasetId: "",
    fraudAlertThreshold: 0.85,
    highRiskAlerts: true,
    trainingNotifications: true,
    maintenanceAlerts: false,
    maxConcurrentJobs: 2,
    predictionBatchSize: 500,
    autoBackupModels: "daily",
    dataRetentionDays: 180,
    apiRateLimit: 1000,
    enableApiLogging: true,
  });

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

  const { data: userSettings } = useQuery({
    queryKey: ["/api/settings"],
    retry: false,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (userSettings) {
      setSettings({
        activeModelId: userSettings.activeModelId || "",
        defaultTrainingDatasetId: userSettings.defaultTrainingDatasetId || "",
        defaultTestDatasetId: userSettings.defaultTestDatasetId || "",
        fraudAlertThreshold: userSettings.fraudAlertThreshold || 0.85,
        highRiskAlerts: userSettings.highRiskAlerts ?? true,
        trainingNotifications: userSettings.trainingNotifications ?? true,
        maintenanceAlerts: userSettings.maintenanceAlerts ?? false,
        maxConcurrentJobs: userSettings.maxConcurrentJobs || 2,
        predictionBatchSize: userSettings.predictionBatchSize || 500,
        autoBackupModels: userSettings.autoBackupModels || "daily",
        dataRetentionDays: userSettings.dataRetentionDays || 180,
        apiRateLimit: userSettings.apiRateLimit || 1000,
        enableApiLogging: userSettings.enableApiLogging ?? true,
      });
    }
  }, [userSettings]);

  const { data: models } = useQuery({
    queryKey: ["/api/models"],
    retry: false,
  });

  const { data: datasets } = useQuery({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      return await apiRequest("POST", "/api/settings", settingsData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
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
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleResetSettings = () => {
    setSettings({
      activeModelId: "",
      defaultTrainingDatasetId: "",
      defaultTestDatasetId: "",
      fraudAlertThreshold: 0.85,
      highRiskAlerts: true,
      trainingNotifications: true,
      maintenanceAlerts: false,
      maxConcurrentJobs: 2,
      predictionBatchSize: 500,
      autoBackupModels: "daily",
      dataRetentionDays: 180,
      apiRateLimit: 1000,
      enableApiLogging: true,
    });
  };

  const completedModels = (models || []).filter((m: any) => m.status === "completed");
  const readyDatasets = (datasets || []).filter((d: any) => d.status === "ready");

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-gray-600">
          Configure your fraud detection system and preferences
        </p>
      </div>

      {/* Model Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Model Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="active-model">Active Model</Label>
              <Select
                value={settings.activeModelId}
                onValueChange={(value) => setSettings({ ...settings, activeModelId: value })}
              >
                <SelectTrigger data-testid="select-active-model">
                  <SelectValue placeholder="Select active model..." />
                </SelectTrigger>
                <SelectContent>
                  {completedModels.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.algorithm}) - {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">This model will be used for new predictions</p>
            </div>

            <div>
              <Label htmlFor="default-training">Default Training Dataset</Label>
              <Select
                value={settings.defaultTrainingDatasetId}
                onValueChange={(value) => setSettings({ ...settings, defaultTrainingDatasetId: value })}
              >
                <SelectTrigger data-testid="select-default-training">
                  <SelectValue placeholder="Select default training dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {readyDatasets.map((dataset: any) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name} ({(dataset.size / 1024 / 1024).toFixed(1)}MB)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default-test">Default Test Dataset</Label>
              <Select
                value={settings.defaultTestDatasetId}
                onValueChange={(value) => setSettings({ ...settings, defaultTestDatasetId: value })}
              >
                <SelectTrigger data-testid="select-default-test">
                  <SelectValue placeholder="Select default test dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {readyDatasets.map((dataset: any) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name} ({(dataset.size / 1024 / 1024).toFixed(1)}MB)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model-storage">Model Storage Location</Label>
              <div className="flex">
                <Input
                  id="model-storage"
                  value="/models/production/"
                  readOnly
                  className="rounded-r-none"
                  data-testid="input-model-storage"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none border-l-0"
                  data-testid="button-browse-storage"
                >
                  <FolderOpen size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Alert & Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">High Risk Fraud Alerts</h3>
              <p className="text-sm text-gray-500">Get notified when fraud confidence exceeds threshold</p>
            </div>
            <Switch
              checked={settings.highRiskAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, highRiskAlerts: checked })}
              data-testid="switch-high-risk-alerts"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Training Completion Notifications</h3>
              <p className="text-sm text-gray-500">Email alerts when model training completes</p>
            </div>
            <Switch
              checked={settings.trainingNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, trainingNotifications: checked })}
              data-testid="switch-training-notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">System Maintenance Alerts</h3>
              <p className="text-sm text-gray-500">Notifications about system updates and maintenance</p>
            </div>
            <Switch
              checked={settings.maintenanceAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceAlerts: checked })}
              data-testid="switch-maintenance-alerts"
            />
          </div>

          <div>
            <Label htmlFor="fraud-threshold">Fraud Alert Threshold</Label>
            <div className="flex items-center space-x-4 mt-2">
              <Slider
                value={[settings.fraudAlertThreshold]}
                onValueChange={([value]) => setSettings({ ...settings, fraudAlertThreshold: value })}
                min={0.5}
                max={1.0}
                step={0.01}
                className="flex-1"
                data-testid="slider-fraud-threshold"
              />
              <span className="text-sm font-medium text-gray-900 w-12">
                {(settings.fraudAlertThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Transactions with fraud probability above this threshold will trigger alerts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance & Resource Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="concurrent-jobs">Max Concurrent Training Jobs</Label>
              <Select
                value={settings.maxConcurrentJobs.toString()}
                onValueChange={(value) => setSettings({ ...settings, maxConcurrentJobs: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-concurrent-jobs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="batch-size">Prediction Batch Size</Label>
              <Select
                value={settings.predictionBatchSize.toString()}
                onValueChange={(value) => setSettings({ ...settings, predictionBatchSize: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-batch-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1,000</SelectItem>
                  <SelectItem value="5000">5,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="auto-backup">Auto-backup Models</Label>
              <Select
                value={settings.autoBackupModels}
                onValueChange={(value) => setSettings({ ...settings, autoBackupModels: value })}
              >
                <SelectTrigger data-testid="select-auto-backup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retention">Data Retention Period</Label>
              <Select
                value={settings.dataRetentionDays.toString()}
                onValueChange={(value) => setSettings({ ...settings, dataRetentionDays: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="api-endpoint">API Endpoint URL</Label>
            <Input
              id="api-endpoint"
              value="https://api.fraudguard-ml.com/v1"
              readOnly
              data-testid="input-api-endpoint"
            />
          </div>

          <div>
            <Label htmlFor="rate-limit">API Rate Limit (requests/minute)</Label>
            <Input
              id="rate-limit"
              type="number"
              value={settings.apiRateLimit}
              onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
              data-testid="input-rate-limit"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable API Logging</h3>
              <p className="text-sm text-gray-500">Log all API requests and responses for debugging</p>
            </div>
            <Switch
              checked={settings.enableApiLogging}
              onCheckedChange={(checked) => setSettings({ ...settings, enableApiLogging: checked })}
              data-testid="switch-api-logging"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex space-x-4">
        <Button
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
          className="bg-primary hover:bg-blue-700"
          data-testid="button-save-settings"
        >
          <Save className="mr-2" size={16} />
          {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
        <Button
          variant="outline"
          onClick={handleResetSettings}
          data-testid="button-reset-settings"
        >
          <RotateCcw className="mr-2" size={16} />
          Reset to Defaults
        </Button>
        <Button
          variant="outline"
          className="bg-secondary hover:bg-green-700 text-white"
          data-testid="button-export-settings"
        >
          <Download className="mr-2" size={16} />
          Export Configuration
        </Button>
      </div>
    </div>
  );
}

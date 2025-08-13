import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Eye } from "lucide-react";

export default function DatasetUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
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

  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ["/api/datasets"],
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/datasets", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset uploaded successfully",
      });
      setSelectedFile(null);
      setDatasetName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
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
        description: "Failed to upload dataset",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (datasetId: string) => {
      return await apiRequest("DELETE", `/api/datasets/${datasetId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dataset deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
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
        description: "Failed to delete dataset",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", datasetName || selectedFile.name);
    formData.append("description", description);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const datasetColumns = [
    {
      key: "name" as const,
      label: "Dataset Name",
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: "format" as const,
      label: "Format",
      render: (value: string) => (
        <Badge variant="outline">{value.toUpperCase()}</Badge>
      )
    },
    {
      key: "size" as const,
      label: "Size",
      render: (value: number) => formatFileSize(value)
    },
    {
      key: "createdAt" as const,
      label: "Uploaded",
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: string) => (
        <Badge variant={value === "ready" ? "default" : value === "processing" ? "secondary" : "destructive"}>
          {value}
        </Badge>
      )
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (value: string, item: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-preview-${value}`}
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(value)}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-${value}`}
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
          Dataset Upload
        </h1>
        <p className="text-gray-600">
          Upload and manage your fraud detection training datasets
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload New Dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onFileSelect={setSelectedFile}
            onFileRemove={() => setSelectedFile(null)}
            selectedFile={selectedFile}
            accept={['.csv', '.json', '.txt', '.xlsx']}
            disabled={uploadMutation.isPending}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="Enter dataset name"
                data-testid="input-dataset-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your dataset"
                rows={3}
                data-testid="textarea-description"
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="bg-secondary hover:bg-green-700"
            data-testid="button-upload-dataset"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Dataset"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Datasets */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Uploaded Datasets</h2>
          <Button variant="outline" data-testid="button-export-list">
            <Download className="mr-2" size={16} />
            Export List
          </Button>
        </div>
        
        <DataTable
          data={datasets || []}
          columns={datasetColumns}
          isLoading={datasetsLoading}
          emptyMessage="No datasets uploaded yet. Upload your first dataset to get started."
          searchPlaceholder="Search datasets..."
        />
      </div>
    </div>
  );
}

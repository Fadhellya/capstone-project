import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string[];
  maxSize?: number;
  selectedFile?: File | null;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = ['.csv', '.json', '.txt', '.xlsx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  selectedFile,
  className,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, ext) => {
      acc[`application/${ext.substring(1)}`] = [ext];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false,
    disabled
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-blue-50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          data-testid="dropzone-file-upload"
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-600 mb-4">
            Supported formats: {accept.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: {formatFileSize(maxSize)}
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900" data-testid="text-selected-filename">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500" data-testid="text-selected-filesize">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {onFileRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                data-testid="button-remove-file"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

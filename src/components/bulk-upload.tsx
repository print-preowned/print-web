"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkUploadProps<T> {
  title: string;
  description: string;
  onUpload: (items: T[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  parseCSV: (csvText: string) => T[];
  validateItem: (item: T, index: number) => { valid: boolean; error?: string };
  sampleHeaders: string[];
  sampleRow: string[];
  children?: React.ReactNode;
}

export function BulkUpload<T extends Record<string, any>>({
  title,
  description,
  onUpload,
  parseCSV,
  validateItem,
  sampleHeaders,
  sampleRow,
  children,
}: BulkUploadProps<T>) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
      toast.success(`Parsed ${parsed.length} records from CSV`);
    } catch (error) {
      toast.error(`Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`);
      setFile(null);
      setParsedData([]);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to upload");
      return;
    }

    // Validate all items first
    const validationErrors: string[] = [];
    parsedData.forEach((item, index) => {
      const validation = validateItem(item, index + 2); // +2 for header row and 1-based index
      if (!validation.valid) {
        validationErrors.push(`Row ${index + 2}: ${validation.error || "Invalid data"}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.length} errors found`);
      setUploadResult({
        success: 0,
        failed: parsedData.length,
        errors: validationErrors,
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const result = await onUpload(parsedData);
      setUploadResult(result);
      setProgress(100);

      if (result.success > 0) {
        toast.success(`Successfully uploaded ${result.success} records`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to upload ${result.failed} records`);
      }

      // Reset after successful upload
      if (result.failed === 0) {
        setTimeout(() => {
          setOpen(false);
          setFile(null);
          setParsedData([]);
          setUploadResult(null);
          setProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }, 2000);
      }
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setUploadResult({
        success: 0,
        failed: parsedData.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      setFile(null);
      setParsedData([]);
      setUploadResult(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">CSV File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Select a CSV file to upload. The file should have the following format:
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm font-semibold mb-2">Expected CSV Format:</p>
            <div className="text-xs font-mono space-y-1">
              <div className="text-muted-foreground">
                {sampleHeaders.join(",")}
              </div>
              <div>
                {sampleRow.join(",")}
              </div>
            </div>
          </div>

          {file && parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>
                  {file.name} - {parsedData.length} records ready to upload
                </span>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {uploadResult && (
            <div className="space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{uploadResult.success} successful</span>
                    </div>
                    {uploadResult.failed > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>{uploadResult.failed} failed</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {uploadResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border p-3">
                  <p className="text-sm font-semibold mb-2">Errors:</p>
                  <ul className="text-xs space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-red-600">
                        {error}
                      </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {uploadResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || parsedData.length === 0 || isUploading}
          >
            {isUploading ? "Uploading..." : `Upload ${parsedData.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { FaFileLines, FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/_ui/button";
import { Card, CardContent } from "@/components/_ui/card";
import { Progress } from "@/components/_ui/progress";
import { useDropzone } from "@/hooks/use-dropzone";
import { useSheetStore } from "@/lib/store/sheet-store";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES } from "@/lib/utils/file-validation";

interface ImportDropzoneProps {
  onFileSelect: (file: File) => void;
}

export function ImportDropzone({ onFileSelect }: ImportDropzoneProps) {
  const { importState } = useSheetStore();

  const {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleBrowseClick,
  } = useDropzone({ onFileSelect });

  return (
    <section
      aria-label="File drop zone"
      className={cn(
        "flex items-center justify-center min-h-screen p-8 bg-background transition-colors",
        isDragging && "bg-primary/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card
        className={cn(
          "w-full max-w-xl transition-all",
          isDragging && "ring-2 ring-primary ring-offset-2",
        )}
      >
        <CardContent className="p-12">
          {importState.isImporting ? (
            <ImportProgress
              progress={importState.progress}
              error={importState.error}
            />
          ) : (
            <DropzoneContent
              isDragging={isDragging}
              onBrowseClick={handleBrowseClick}
            />
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  );
}

function DropzoneContent({
  isDragging,
  onBrowseClick,
}: {
  isDragging: boolean;
  onBrowseClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div
        className={cn(
          "w-20 h-20 rounded-full bg-muted flex items-center justify-center transition-colors",
          isDragging && "bg-primary/10",
        )}
      >
        <FaFileLines
          className={cn(
            "w-10 h-10 text-muted-foreground transition-colors",
            isDragging && "text-primary",
          )}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {isDragging ? "Drop your file here" : "Import a spreadsheet"}
        </h2>
        <p className="text-muted-foreground">
          Drag and drop a CSV or Excel file, or click to browse
        </p>
      </div>

      <Button size="lg" onClick={onBrowseClick}>
        Browse files
      </Button>

      <p className="text-sm text-muted-foreground">
        Supports .csv, .xlsx, and .xls files up to 100K+ rows
      </p>
    </div>
  );
}

function ImportProgress({
  progress,
  error,
}: {
  progress: number;
  error: string | null;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <FaSpinner className="w-10 h-10 text-primary animate-spin" />
      </div>

      <div className="space-y-2 w-full">
        <h2 className="text-2xl font-semibold tracking-tight">
          {error ? "Import failed" : "Importing..."}
        </h2>

        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <>
            <Progress value={progress} className="w-full" />
            <p className="text-muted-foreground">{Math.round(progress)}%</p>
          </>
        )}
      </div>
    </div>
  );
}

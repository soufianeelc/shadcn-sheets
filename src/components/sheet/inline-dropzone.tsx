"use client";

import { Loader } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/_ui/progress";
import { useDropzone } from "@/hooks/use-dropzone";
import { useSheetStore } from "@/lib/store/sheet-store";
import { cn } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES } from "@/lib/utils/file-validation";

interface InlineDropzoneProps {
  onFileSelect: (file: File) => void;
}

export function InlineDropzone({ onFileSelect }: InlineDropzoneProps) {
  const { importState } = useSheetStore();

  const {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleBrowseClick,
  } = useDropzone({
    onFileSelect,
    isDisabled: importState.isImporting,
  });

  return (
    <>
      <button
        type="button"
        tabIndex={0}
        aria-label="Drop zone for file upload"
        className={cn(
          "group relative rounded-xl w-full border-2 border-dashed transition-all duration-200 min-h-[300px]",
          importState.isImporting
            ? "border-primary bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 cursor-default"
            : isDragging
              ? "border-primary bg-primary/5 scale-[1.01] cursor-pointer"
              : "border-border/60 hover:border-primary/50 hover:bg-muted/30 cursor-pointer",
        )}
        onDragOver={importState.isImporting ? undefined : handleDragOver}
        onDragLeave={importState.isImporting ? undefined : handleDragLeave}
        onDrop={importState.isImporting ? undefined : handleDrop}
        onClick={importState.isImporting ? undefined : handleBrowseClick}
        onKeyDown={
          importState.isImporting
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleBrowseClick();
                }
              }
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 p-8 py-12 h-full">
          {importState.isImporting ? (
            <ImportingState
              progress={importState.progress}
              error={importState.error}
            />
          ) : (
            <IdleState isDragging={isDragging} />
          )}
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

function ImportingState({
  progress,
  error,
}: {
  progress: number;
  error: string | null;
}) {
  return (
    <>
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Loader className="h-12 w-12 text-primary animate-spin" />
      </div>

      <div className="flex flex-col items-center text-center space-y-3 w-full max-w-md">
        <p className="text-lg font-semibold">
          {error ? "Import failed" : "Importing your file..."}
        </p>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <Progress value={progress} className="w-full h-2" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function IdleState({ isDragging }: { isDragging: boolean }) {
  return (
    <>
      <div className="relative w-24 h-24 transition-transform group-hover:scale-110">
        <Image
          src="/folder-upload.svg"
          alt="Upload file"
          width={96}
          height={96}
          className={cn(
            "transition-opacity",
            isDragging ? "opacity-80" : "opacity-100",
          )}
        />
      </div>

      <div className="flex flex-col items-center text-center space-y-2">
        <p
          className={cn(
            "text-lg font-semibold transition-colors",
            isDragging ? "text-primary" : "text-foreground",
          )}
        >
          {isDragging
            ? "Drop your file here"
            : "Drop a file or click to import"}
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Supports CSV and Excel files (.csv, .xlsx, .xls) up to 100K+ rows
        </p>
      </div>
    </>
  );
}

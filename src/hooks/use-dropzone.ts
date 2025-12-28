import { useCallback, useRef, useState } from "react";
import {
  FILE_TYPE_ERROR_MESSAGE,
  isValidFileType,
} from "@/lib/utils/file-validation";

interface UseDropzoneProps {
  onFileSelect: (file: File) => void;
  isDisabled?: boolean;
}

export function useDropzone({
  onFileSelect,
  isDisabled = false,
}: UseDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [isDisabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [isDisabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (isValidFileType(file)) {
          onFileSelect(file);
        } else {
          alert(FILE_TYPE_ERROR_MESSAGE);
        }
      }
    },
    [onFileSelect, isDisabled],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      e.target.value = "";
    },
    [onFileSelect],
  );

  const handleBrowseClick = useCallback(() => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  }, [isDisabled]);

  return {
    isDragging,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleBrowseClick,
  };
}

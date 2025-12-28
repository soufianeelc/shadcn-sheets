import { useCallback, useEffect, useRef } from "react";

interface UseCellFocusProps {
  isActive: boolean;
  isEditing: boolean;
}

export function useCellFocus({ isActive, isEditing }: UseCellFocusProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasEditingRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (
      wasEditingRef.current &&
      !isEditing &&
      isActive &&
      cellRef.current
    ) {
      cellRef.current.focus();
    }
    wasEditingRef.current = isEditing;
  }, [isEditing, isActive]);

  useEffect(() => {
    if (isActive && !isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isActive, isEditing]);

  return { cellRef, inputRef };
}

interface UseCellEditingProps {
  rowIndex: number;
  colId: string;
  onSelect: (row: number, col: string) => void;
  onDoubleClick: () => void;
  onCommit: () => void;
  onCancel: () => void;
}

export function useCellEditing({
  rowIndex,
  colId,
  onSelect,
  onDoubleClick,
  onCommit,
  onCancel,
}: UseCellEditingProps) {
  const handleClick = useCallback(() => {
    onSelect(rowIndex, colId);
  }, [rowIndex, colId, onSelect]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick();
  }, [onDoubleClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(rowIndex, colId);
      }
    },
    [rowIndex, colId, onSelect],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onCommit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        e.preventDefault();
        onCommit();
      }
      e.stopPropagation();
    },
    [onCommit, onCancel],
  );

  const handleInputBlur = useCallback(() => {
    onCommit();
  }, [onCommit]);

  return {
    handleClick,
    handleDoubleClick,
    handleKeyDown,
    handleInputKeyDown,
    handleInputBlur,
  };
}

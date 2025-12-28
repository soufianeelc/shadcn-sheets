"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/_ui/input";

interface CellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  width: number;
  style?: React.CSSProperties;
}

export function CellEditor({
  value,
  onChange,
  onCommit,
  onCancel,
  width,
  style,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  const handleBlur = () => {
    onCommit();
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="absolute h-8 rounded-none border-2 border-primary focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-xs"
      style={{
        width,
        minWidth: width,
        ...style,
      }}
    />
  );
}

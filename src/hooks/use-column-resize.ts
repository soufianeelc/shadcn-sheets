import { useCallback, useRef, useState } from "react";

interface UseColumnResizeProps {
  columnId: string;
  initialWidth: number;
  onResize: (columnId: string, width: number) => void;
}

export function useColumnResize({
  columnId,
  initialWidth,
  onResize,
}: UseColumnResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = initialWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(40, startWidthRef.current + delta);
        onResize(columnId, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columnId, initialWidth, onResize],
  );

  return { isResizing, handleResizeStart };
}

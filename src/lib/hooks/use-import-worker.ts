"use client";

import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSheetStore } from "@/lib/store/sheet-store";
import type { SheetMeta } from "@/types";

interface WorkerProgressMessage {
  type: "progress";
  percent: number;
}

interface WorkerDoneMessage {
  type: "done";
  sheetMeta: SheetMeta;
}

interface WorkerErrorMessage {
  type: "error";
  message: string;
}

type WorkerMessage =
  | WorkerProgressMessage
  | WorkerDoneMessage
  | WorkerErrorMessage;

export function useImportWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { setImportState, onImportComplete } = useSheetStore();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/import.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "progress":
          setImportState({ progress: message.percent });
          break;

        case "done":
          onImportComplete(message.sheetMeta);
          break;

        case "error":
          setImportState({
            isImporting: false,
            error: message.message,
          });
          break;
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Import worker error:", error);
      setImportState({
        isImporting: false,
        error: `Worker error: ${error.message}`,
      });
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setImportState, onImportComplete]);

  const importFile = useCallback(
    (file: File) => {
      if (!workerRef.current) {
        console.error("Worker not initialized");
        return;
      }

      const sheetId = uuidv4();

      setImportState({
        isImporting: true,
        progress: 0,
        error: null,
      });

      workerRef.current.postMessage({
        type: "import",
        file,
        sheetId,
        fileName: file.name,
      });
    },
    [setImportState],
  );

  return { importFile };
}

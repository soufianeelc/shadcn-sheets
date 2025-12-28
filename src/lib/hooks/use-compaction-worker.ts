"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSheetStore } from "@/lib/store/sheet-store";

interface CheckResultMessage {
  type: "checkResult";
  needsCompaction: boolean;
  patchCount: number;
}

interface DoneMessage {
  type: "done";
  patchesRemoved: number;
  chunksUpdated: number;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

type WorkerMessage = CheckResultMessage | DoneMessage | ErrorMessage;

export function useCompactionWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { sheetId } = useSheetStore();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/compaction.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      switch (message.type) {
        case "checkResult":
          if (message.needsCompaction) {
            console.log(
              `[Compaction] ${message.patchCount} patches found, starting compaction...`,
            );
            const { sheetId } = useSheetStore.getState();
            if (sheetId && workerRef.current) {
              workerRef.current.postMessage({ type: "compact", sheetId });
            }
          }
          break;

        case "done": {
          console.log(
            `[Compaction] Complete: ${message.patchesRemoved} patches merged, ${message.chunksUpdated} chunks updated`,
          );
          const { viewportStart, viewportEnd } = useSheetStore.getState();
          useSheetStore.getState().loadViewport(viewportStart, viewportEnd);
          break;
        }

        case "error":
          console.error("[Compaction] Error:", message.message);
          break;
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Compaction worker error:", error);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const checkCompaction = useCallback(() => {
    if (!workerRef.current || !sheetId) return;

    workerRef.current.postMessage({ type: "check", sheetId });
  }, [sheetId]);

  const triggerCompaction = useCallback(() => {
    if (!workerRef.current || !sheetId) return;

    workerRef.current.postMessage({ type: "compact", sheetId });
  }, [sheetId]);

  return { checkCompaction, triggerCompaction };
}

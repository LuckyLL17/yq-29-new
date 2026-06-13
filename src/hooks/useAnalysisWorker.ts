import { useCallback, useRef, useEffect } from 'react';
import type { AnalysisTaskType } from '@/workers/types';
import AnalysisWorker from '@/workers/analysisWorker?worker';

interface PendingTask {
  resolve: (result: any) => void;
  reject: (error: any) => void;
  onProgress?: (progress: number, message?: string) => void;
}

export function useAnalysisWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingTasksRef = useRef<Map<string, PendingTask>>(new Map());

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new AnalysisWorker();

    worker.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data;
      const pendingTask = pendingTasksRef.current.get(data.id);

      if (!pendingTask) return;

      if (type === 'success') {
        pendingTask.resolve(data.result);
        pendingTasksRef.current.delete(data.id);
      } else if (type === 'error') {
        pendingTask.reject(new Error(data.error));
        pendingTasksRef.current.delete(data.id);
      } else if (type === 'progress') {
        pendingTask.onProgress?.(data.progress, data.message);
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      for (const [, task] of pendingTasksRef.current) {
        task.reject(new Error(error.message));
      }
      pendingTasksRef.current.clear();
      workerRef.current = null;
    };

    workerRef.current = worker;
    return worker;
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingTasksRef.current.clear();
    };
  }, []);

  const runAnalysis = useCallback(
    <T = any>(
      type: AnalysisTaskType,
      payload: any,
      onProgress?: (progress: number, message?: string) => void
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        pendingTasksRef.current.set(id, {
          resolve,
          reject,
          onProgress,
        });

        const worker = initWorker();
        worker.postMessage({ id, type, payload });
      });
    },
    [initWorker]
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingTasksRef.current.clear();
  }, []);

  return { runAnalysis, terminate };
}

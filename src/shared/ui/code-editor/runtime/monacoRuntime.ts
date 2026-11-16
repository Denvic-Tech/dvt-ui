import { loader } from '@monaco-editor/react';

type MonacoEnvironmentShape = {
  getWorker: (_moduleId: string, label: string) => Worker;
};

type MonacoModule = typeof import('monaco-editor');
type WorkerFactoryModule = {
  default: new () => Worker;
};

export type MonacoRuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';

type Listener = () => void;

let runtimePromise: Promise<void> | null = null;
let status: MonacoRuntimeStatus = 'idle';
let runtimeError: Error | null = null;
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach(listener => listener());
};

const setStatus = (next: MonacoRuntimeStatus, error: Error | null = null) => {
  status = next;
  runtimeError = error;
  notify();
};

/**
 * Loads the Monaco core and the workers the app really uses (editor + json),
 * wires `MonacoEnvironment.getWorker`, then points `@monaco-editor/react`'s
 * loader at the local bundle. Must resolve before any `<MonacoEditor>` mounts,
 * otherwise the loader falls back to fetching Monaco from a CDN.
 *
 * Python/SQL highlighting is provided by Monarch tokenizers on the main thread
 * and only needs the generic editor worker; JSON validation needs json.worker.
 */
export const ensureMonacoRuntime = (): Promise<void> => {
  if (runtimePromise) {
    return runtimePromise;
  }

  setStatus('loading');

  runtimePromise = Promise.all([
    import('monaco-editor') as Promise<MonacoModule>,
    import('monaco-editor/esm/vs/editor/editor.worker?worker') as Promise<WorkerFactoryModule>,
    import('monaco-editor/esm/vs/language/json/json.worker?worker') as Promise<WorkerFactoryModule>,
  ])
    .then(([monaco, editorWorkerModule, jsonWorkerModule]) => {
      const monacoGlobal = globalThis as typeof globalThis & {
        MonacoEnvironment?: MonacoEnvironmentShape;
      };

      monacoGlobal.MonacoEnvironment = {
        getWorker: (_moduleId, label) => {
          if (label === 'json') {
            return new jsonWorkerModule.default();
          }

          return new editorWorkerModule.default();
        },
      };

      loader.config({ monaco });
      setStatus('ready');
    })
    .catch((error: unknown) => {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      console.error('Failed to load Monaco runtime', normalized);
      setStatus('error', normalized);
      throw normalized;
    });

  return runtimePromise;
};

export const getMonacoRuntimeStatus = (): MonacoRuntimeStatus => status;

export const isMonacoRuntimeReady = (): boolean => status === 'ready';

export const getMonacoRuntimeError = (): Error | null => runtimeError;

export const subscribeMonacoRuntime = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

import { loader } from '@monaco-editor/react';

type MonacoEnvironmentShape = {
  getWorker: (_moduleId: string, label: string) => Worker;
};

type MonacoModule = typeof import('monaco-editor');
type WorkerFactoryModule = {
  default: new () => Worker;
};

let configurePromise: Promise<void> | null = null;

export const configureMonaco = () => {
  if (configurePromise) {
    return configurePromise;
  }

  configurePromise = Promise.all([
    import('monaco-editor') as Promise<MonacoModule>,
    import('monaco-editor/esm/vs/editor/editor.worker?worker') as Promise<WorkerFactoryModule>,
    import('monaco-editor/esm/vs/language/json/json.worker?worker') as Promise<WorkerFactoryModule>,
    import('monaco-editor/esm/vs/language/css/css.worker?worker') as Promise<WorkerFactoryModule>,
    import('monaco-editor/esm/vs/language/html/html.worker?worker') as Promise<WorkerFactoryModule>,
    import('monaco-editor/esm/vs/language/typescript/ts.worker?worker') as Promise<WorkerFactoryModule>,
  ]).then(
    ([
      monaco,
      editorWorkerModule,
      jsonWorkerModule,
      cssWorkerModule,
      htmlWorkerModule,
      tsWorkerModule,
    ]) => {
      const monacoGlobal = globalThis as typeof globalThis & {
        MonacoEnvironment?: MonacoEnvironmentShape;
      };

      monacoGlobal.MonacoEnvironment = {
        getWorker: (_moduleId, label) => {
          if (label === 'json') {
            return new jsonWorkerModule.default();
          }

          if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorkerModule.default();
          }

          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorkerModule.default();
          }

          if (label === 'typescript' || label === 'javascript') {
            return new tsWorkerModule.default();
          }

          return new editorWorkerModule.default();
        },
      };

      loader.config({ monaco });
    }
  );

  return configurePromise;
};

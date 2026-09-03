import ELK, { type ELK as ElkLayoutEngine } from 'elkjs/lib/elk-api';
import ElkWorker from 'elkjs/lib/elk-worker.min.js?worker';

let engine: ElkLayoutEngine | null = null;

export const getElkLayoutEngine = (): ElkLayoutEngine => {
  if (!engine) {
    engine = new ELK({
      workerFactory: () => new ElkWorker(),
    });
  }
  return engine;
};

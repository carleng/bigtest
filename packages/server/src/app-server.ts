import { timeout, spawn } from 'effection';
import { fetch } from '@effection/fetch';
import { exec, Process } from '@effection/node';
import * as process from 'process';
import { OrchestratorState, AppOptions, Service } from './orchestrator/state';
import { Atom } from '@bigtest/atom';
import { restartable } from './effection/restartable'

export const appServer: Service<AppOptions> = (options) => {
  let appOptions = options.atom.slice('appService', 'appOptions');
  return restartable(appOptions, startApp(options));
}

const startApp = ({ atom }: { atom: Atom<OrchestratorState> }) => function* (options: AppOptions) {
  if(!options.url) {
    throw new Error('no app url given');
  }

  let appStatus = atom.slice('appService', 'status');

  appStatus.set({ type: 'unstarted' });

  if (options.command) {
    let child: Process = yield exec(options.command as string, {
      cwd: options.dir,
      env: Object.assign({}, process.env, options.env),
    });

    yield spawn(function* () {
      let exitStatus = yield child.join();

      appStatus.set({ type: 'exited', exitStatus });
    });
  }

  appStatus.set({ type: 'started' });

  while(!(yield isReachable(options.url))) {
    yield timeout(100);
  }

  appStatus.set({ type: 'reachable' });

  yield;
}

function* isReachable(url: string) {
  try {
    let response: Response = yield fetch(url);
    return response.ok;
  } catch (error) {
    if (error.name === 'FetchError') {
      return false;
    } else {
      throw error;
    }
  }
}

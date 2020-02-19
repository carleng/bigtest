import { Operation, Context } from 'effection';
import * as xp from 'express';
import * as Path from 'path';
import { Server } from 'http';

interface Options {
  port: number;
  externalURL?: string;
}

export class AgentServer {

  protected constructor(public url: string) {}

  static create(options: Options) {
    if (options.externalURL) {
      return new AgentServer(options.externalURL);
    } else {
      if (!options.port) {
        throw new Error('An agent server must be created with either an external url or a port number');
      }
      return new HttpAgentServer(options.port);
    }
  }

  connectURL(connectBackURL: string) {
    return `${this.url}/?connectTo=${encodeURIComponent(connectBackURL)}`;
  }

  get harnessScriptURL() {
    return `${this.url}/harness.js`;
  }

  *listen(): Operation { return; }

  *join(): Operation { yield; }
}

class HttpAgentServer extends AgentServer {
  http?: Server;
  constructor(private port: number) {
    super(`http://localhost:${port}`);
  }

  *listen() {
    let appDir = Path.join(__dirname, 'app');
    let express = xp;
    let app = express()
      .use(express.static(appDir));

    let server: Server = yield listen(app, this.port);
    this.http = server;

    let context: Context = yield parent;
    context['ensure'](() => server.close());
  }

  join(): Operation {
    return ({ resume, ensure }) => {
      if (this.http) {
        this.http.on('close', resume);
        ensure(() => this.http.off('close', resume));
      } else {
        throw new Error('cannot join a server that is not already listening');
      }
    }
  }

}

function listen(app: xp.Express, port?: number): Operation {
  return ({ resume, fail }) => {
    let server = app.listen(port, (err) => {
      if (err) {
        fail(err);
      } else {
        resume(server);
      }
    })
  };
};


const parent: Operation = ({ resume, context: { parent } }) => resume(parent.parent);

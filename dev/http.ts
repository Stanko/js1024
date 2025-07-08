import type { Server } from 'bun';
import { getPage, paths } from '.';

export class HttpServer {
  server: Server;

  constructor({ port = 1234 }) {
    this.server = Bun.serve({
      port,
      async fetch(req) {
        try {
          const url = new URL(req.url);

          const handlers: Record<string, () => Promise<Response>> = {
            '/': async () => {
              const page = await getPage();
              return new Response(page, {
                headers: { 'Content-Type': 'text/html' },
              });
            },
            '/min.html': async () => {
              const page = await getPage(true);
              return new Response(page, {
                headers: { 'Content-Type': 'text/html' },
              });
            },
            '/favicon.ico': async () => {
              const favicon = Bun.file(paths.FAVICON);
              return new Response(favicon, {
                headers: { 'Content-Type': favicon.type },
              });
            },
            '/ws-debug.js': async () => {
              const wsDebug = Bun.file(paths.WS_DEBUG);
              return new Response(wsDebug, {
                headers: { 'Content-Type': wsDebug.type },
              });
            },
          };

          const handler = handlers[url.pathname];

          if (handler) {
            return await handler();
          }

          return new Response('Not Found', { status: 404 });
        } catch (error) {
          console.error('Error serving file:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      },
    });

    console.log(
      `http server: http://${this.server.hostname}:${this.server.port}`
    );
  }
}

import type { Server, ServerWebSocket } from 'bun';

export class SocketServer {
  clients = new Set<ServerWebSocket<unknown>>();
  server: Server;

  constructor({ port = 4321 }) {
    this.server = Bun.serve({
      port,
      fetch(req, server) {
        const success = server.upgrade(req);
        if (success) {
          // Bun automatically returns a 101 Switching Protocols
          // if the upgrade succeeds
          return;
        }

        // handle HTTP request normally
        return new Response('This is a web socket server!');
      },
      websocket: {
        open: (ws) => {
          this.clients.add(ws);
        },
        close: (ws) => {
          this.clients.delete(ws);
        },
        message: async () => {
          // This is one way websocket server
          // server will ignore any messages
        },
      },
    });

    console.log(`ws server: ws://${this.server.hostname}:${this.server.port}`);
  }

  broadcast(message: string | Record<string, unknown>) {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
}

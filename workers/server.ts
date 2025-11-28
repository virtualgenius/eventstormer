import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";

// Yjs collaboration server using Durable Objects
export class YjsRoom extends YServer {
  // YServer handles all Yjs sync automatically
  // Override onLoad/onSave for custom persistence if needed later
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        timestamp: new Date().toISOString()
      });
    }

    // Route WebSocket connections to PartyServer
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;

interface Env {
  YjsRoom: DurableObjectNamespace;
}

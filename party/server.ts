import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsServer implements Party.Server {
  constructor(readonly room: Party.Room) {
    console.log(`[PartyKit] Room initialized: ${room.id}`);
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[PartyKit] Client connecting - Room: ${this.room.id}, IP: ${ctx.request.headers.get('cf-connecting-ip')}`);

    return await onConnect(conn, this.room, {
      persist: { mode: "snapshot" },
      callback: {
        handler: async () => {
          console.log(`[PartyKit] Message handled in room: ${this.room.id}`);
        }
      }
    });
  }

  onRequest(req: Party.Request) {
    // Health check endpoint
    if (req.method === "GET" && new URL(req.url).pathname === "/health") {
      console.log(`[PartyKit] Health check requested`);
      return new Response(JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        room: this.room.id,
        connections: this.room.getConnections().length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default Yjs handling
    return new Response("Not found", { status: 404 });
  }

  onError(connection: Party.Connection, error: Error) {
    console.error(`[PartyKit] Error in room ${this.room.id}:`, error);
  }
}

import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";

const STORAGE_KEY = "yjs-document";

// Yjs collaboration server using Durable Objects with SQLite persistence
export class YjsRoom extends YServer {
  // Configure save timing - save 2 seconds after last edit, max 10 seconds
  static callbackOptions = {
    debounceWait: 2000,
    debounceMaxWait: 10000,
    timeout: 5000,
  };

  // Load document state from Durable Object storage on first connection
  async onLoad(): Promise<void> {
    try {
      const stored = await this.ctx.storage.get<Uint8Array>(STORAGE_KEY);
      if (stored) {
        console.log(`[YjsRoom] Loading document for room: ${this.name}, size: ${stored.byteLength} bytes`);
        Y.applyUpdate(this.document, new Uint8Array(stored));
      } else {
        console.log(`[YjsRoom] No stored document for room: ${this.name}, starting fresh`);
      }
    } catch (error) {
      console.error(`[YjsRoom] Error loading document for room ${this.name}:`, error);
    }
  }

  // Save document state to Durable Object storage after edits
  async onSave(): Promise<void> {
    try {
      const update = Y.encodeStateAsUpdate(this.document);
      await this.ctx.storage.put(STORAGE_KEY, update);
      console.log(`[YjsRoom] Saved document for room: ${this.name}, size: ${update.byteLength} bytes`);
    } catch (error) {
      console.error(`[YjsRoom] Error saving document for room ${this.name}:`, error);
    }
  }
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

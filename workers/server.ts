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
  // Returns a Y.Doc to be merged into this.document, or undefined if no stored state
  async onLoad(): Promise<Y.Doc | undefined> {
    try {
      const stored = await this.ctx.storage.get<Uint8Array>(STORAGE_KEY);
      if (stored && stored.byteLength > 0) {
        console.log(`[YjsRoom] Loading document for room: ${this.name}, size: ${stored.byteLength} bytes`);
        const doc = new Y.Doc();
        Y.applyUpdate(doc, new Uint8Array(stored));
        return doc;
      } else {
        console.log(`[YjsRoom] No stored document for room: ${this.name}, starting fresh`);
        return undefined;
      }
    } catch (error) {
      console.error(`[YjsRoom] Error loading document for room ${this.name}:`, error);
      return undefined;
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

import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room, {
      persist: false, // Enable persistence in production
      callback: {
        handler: async () => {
          // Optional: Add custom message handling here
        }
      }
    });
  }
}

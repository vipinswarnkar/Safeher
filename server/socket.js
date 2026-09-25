import { Server } from "socket.io";
import Journey from "./models/journey.js";

let io = null;

// Room name for everyone watching one journey's tracking link
export const trackRoom = (shareToken) => `track:${shareToken}`;

/*
 * Realtime updates for the public tracking page.
 * A viewer sends "track:join" with the share token from the link; if that
 * journey exists they are put in its room and receive "track:location"
 * and "track:status" events.
 */
export function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("track:join", async (token, reply) => {
      const respond = typeof reply === "function" ? reply : () => {};

      if (typeof token !== "string" || token.length < 16 || token.length > 64) {
        return respond({ ok: false });
      }

      try {
        const exists = await Journey.exists({ shareToken: token });
        if (!exists) return respond({ ok: false });

        socket.join(trackRoom(token));
        respond({ ok: true });
      } catch {
        respond({ ok: false });
      }
    });
  });

  return io;
}

// Emit to a journey's viewers. Safe to call when sockets aren't set up (tests).
export function emitToTrackers(shareToken, event, payload) {
  if (!io || !shareToken) return;
  io.to(trackRoom(shareToken)).emit(event, payload);
}

from __future__ import annotations

import asyncio
from collections import defaultdict

from fastapi import WebSocket


class RoomBroker:
    """In-memory pub/sub for chat rooms.

    Acts as a free-tier substitute for Cloudflare Durable Objects: each room
    keeps a list of connected sockets, and `broadcast` pushes payloads to all
    subscribers. Idle rooms drop themselves automatically once the last
    socket disconnects, mirroring the "sleep when inactive" semantics.
    """

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def join(self, room: str, socket: WebSocket) -> None:
        async with self._lock:
            self._rooms[room].add(socket)

    async def leave(self, room: str, socket: WebSocket) -> None:
        async with self._lock:
            if room in self._rooms:
                self._rooms[room].discard(socket)
                if not self._rooms[room]:
                    self._rooms.pop(room, None)

    async def broadcast(self, room: str, payload: dict[str, object]) -> None:
        async with self._lock:
            sockets = list(self._rooms.get(room, ()))
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                # Drop broken sockets; reconnects are the client's job.
                await self.leave(room, socket)


broker = RoomBroker()

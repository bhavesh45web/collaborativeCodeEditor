"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "create-room" | "enter-room";

export default function LandingPage() {
  const router = useRouter();
  const [roomNo, setRoomNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(action: Action) {
    const room = roomNo.trim();
    if (!room) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNo: room }),
      });

      if (!res.ok) {
        setError(action === "create-room" ? "Failed to create room" : "Failed to enter room");
        return;
      }

      router.push(`/api/v1/room/${encodeURIComponent(room)}`);
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || roomNo.trim() === "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Collab Editor</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Code together in real time. Pick a room number to start.
        </p>

        <input
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit("enter-room")}
          placeholder="Room number"
          className="mt-6 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => submit("create-room")}
            disabled={disabled}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start a room
          </button>
          <button
            onClick={() => submit("enter-room")}
            disabled={disabled}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 font-medium hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enter a room
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}
"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";

function EditorContent() {
  const socketRef           = useRef<WebSocket | null>(null);
  const editorRef           = useRef<any>(null);

  const [doc]            = useState(() => new Y.Doc());

  const bindingRef          = useRef<any>(null);


  const params              = useParams<{ roomId: string }>();
  const roomId              = params.roomId;


  useEffect(() => {
    if (!roomId) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to room:", roomId);
      ws.send(JSON.stringify({ type: "join", roomId }));
    };

    ws.onmessage = (event) => {

    if (event.data instanceof ArrayBuffer) {
      Y.applyUpdate(doc, new Uint8Array(event.data), "remote");
      return;
    }

  }

  return () => {

    bindingRef.current?.destroy();

    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    } else if (ws.readyState === WebSocket.CONNECTING) {
      ws.addEventListener("open", () => ws.close());
    }
  };
}, [roomId]);


  async function applyMount(editor: any){
      const { MonacoBinding } = await import("y-monaco");

      bindingRef.current = new MonacoBinding(
        doc.getText("monaco"),
        editor.getModel(),
        new Set([editor])
      )
  }

  return (
   <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
  {/* Header */}
  <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
    <h1 className="text-lg font-semibold tracking-tight">Collab Editor</h1>
    <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
      Room: <span className="font-mono text-emerald-400">{roomId}</span>
    </span>
  </header>

  {/* Editor panel */}
  <main className="flex-1 p-4">
    <div className="h-full overflow-hidden rounded-xl border border-zinc-800 shadow-lg">
      <Editor
        onMount={applyMount}
        height="100%"
        width="100%"
        language="javascript"
        theme="vs-dark"
        loading={<p className="p-4 text-zinc-500">Loading editor...</p>}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          readOnly: false,
          padding: { top: 12 },
          fontLigatures: true,
        }}
      />
    </div>
  </main>
</div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-4">Loading room...</p>}>
      <EditorContent />
    </Suspense>
  );
}

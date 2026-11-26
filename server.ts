import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

import * as Y from 'yjs';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '8080', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

type Room = { sockets: Set<WebSocket>, doc: Y.Doc};

const rooms: Map<string, Room> = new Map<string, Room>();
const socketRooms = new WeakMap<WebSocket, string>();

function createRoom(){
  const doc = new Y.Doc();
  
  const sockets = new Set<WebSocket>();

  doc.on("update", (update, origin)=>{
    sockets?.forEach(socket => {
      if(socket !== origin && socket.readyState === WebSocket.OPEN){
          socket.send(update)
      }
    })
  });

  return {sockets: sockets, doc: doc};
}

function removeUserFromRooms(socket: WebSocket) {
  rooms.forEach((room, roomId) => {
    room.sockets.delete(socket); 
    if (room.sockets.size === 0){
      room.doc.destroy();
      rooms.delete(roomId);
      
    }
  });
  console.log(rooms.size);

}

function addUserToRoom(roomId: string, socket: WebSocket) {
  if (!rooms.has(roomId)) {
    const room = createRoom();
    rooms.set(roomId, room);
  }

  rooms.get(roomId)!.sockets.add(socket);

  socketRooms.set(socket, roomId);

  const initDoc = Y.encodeStateAsUpdate(rooms.get(roomId)!.doc);

  if(socket.readyState === WebSocket.OPEN){
    socket.send(initDoc);
  }
  console.log(`Room ${roomId}: ${rooms.get(roomId)!.sockets.size} user(s)`);
}


app.prepare().then(() => {
  // 1. Create the standard Node.js HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });


const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);

    if (pathname === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit('connection', ws, request);
      });
    }
  });

   
  wss.on('connection', (ws: WebSocket) => {
    
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WS server' }));

    ws.on('message', (data: any, isBinary: boolean) => {

      if(isBinary) {
        const roomId = socketRooms.get(ws);
        const room  = roomId ? rooms.get(roomId) : undefined;

        if(!room) return ;

        Y.applyUpdate(room.doc, new Uint8Array(data as Buffer), ws);

        return;
      }

      try {
      const message = JSON.parse(data.toString());

      if(message.type === 'join'){
        addUserToRoom(message.roomId, ws);
      }

    }
      catch(err){
        console.error('Error processing message:', err);
    }
  });

    ws.on('close', () => {
      removeUserFromRooms(ws); // Clean up user from rooms
    });

  });

  // 5. Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

});

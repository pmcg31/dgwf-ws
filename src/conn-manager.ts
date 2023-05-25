import * as ws from 'ws';

type ConnMapValue = {
  remoteAddress: string;
  remotePort: number;
  playerId?: string;
};

type QueryMapValue = {
  ws: ws.WebSocket;
  key: object;
};

const connectionMap = new Map<ws.WebSocket, ConnMapValue>();

function handleMessage(e: ws.MessageEvent) {
  const conn = connectionMap.get(e.target);
  if (conn) {
    const data = JSON.parse(e.data as string);
    if (Object.prototype.hasOwnProperty.call(data, 'playerId')) {
      if (conn.playerId) {
        console.log(
          `${conn.remoteAddress}[${conn.remotePort}] Player offline: ${conn.playerId}`
        );
      }
      conn.playerId = data.playerId;
      if (conn.playerId) {
        console.log(
          `${conn.remoteAddress}[${conn.remotePort}] Player online: ${data.playerId}`
        );
      }
    } else if (Object.prototype.hasOwnProperty.call(data, 'usingQuery')) {
      console.log(
        `${conn.remoteAddress}[${conn.remotePort}] usingQuery: ${JSON.stringify(
          data.usingQuery
        )}`
      );
    } else if (Object.prototype.hasOwnProperty.call(data, 'releaseQuery')) {
      console.log(
        `${conn.remoteAddress}[${
          conn.remotePort
        }] releaseQuery: ${JSON.stringify(data.releaseQuery)}`
      );
    } else if (Object.prototype.hasOwnProperty.call(data, 'mutation')) {
      console.log(
        `${conn.remoteAddress}[${conn.remotePort}] mutation: ${
          Object.keys(data.mutation)[0]
        }`
      );
      // Forward to all connections
      const msg = JSON.stringify({ mutation: Object.keys(data.mutation)[0] });
      for (const ws of connectionMap.keys()) {
        // Don't send back to originator
        if (ws !== e.target) {
          const tmp = connectionMap.get(ws);
          if (tmp) {
            console.log(`${tmp.remoteAddress}[${tmp.remotePort}] ===> ${msg}`);
          }
          ws.send(msg);
        }
      }
    }
  }
}

function handleClose(e: ws.CloseEvent) {
  const conn = connectionMap.get(e.target);
  if (conn) {
    if (conn.playerId) {
      console.log(
        `${conn.remoteAddress}[${conn.remotePort}] Player offline: ${conn.playerId}`
      );
    }

    // Remove all query map values using this
    // conection

    // Remove from connection map
    connectionMap.delete(e.target);

    console.log(
      `${conn.remoteAddress}[${conn.remotePort}] is outta here! total connections: ${connectionMap.size}`
    );
  }
}

export function acceptConnection(
  remoteAddress: string,
  remotePort: number,
  ws: ws.WebSocket
) {
  // Save the connection
  connectionMap.set(ws, {
    remoteAddress,
    remotePort
  });

  // Handle messages from this connection
  ws.addEventListener('message', handleMessage);

  // Handle the closing of this connection
  ws.addEventListener('close', handleClose);

  console.log(
    `Accepted connection from ${remoteAddress}[${remotePort}]; total connections: ${connectionMap.size}`
  );
}

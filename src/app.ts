import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import https from 'https';
import express from 'express';
import expressWs from 'express-ws';

const connections = [];

function addConn(from, ws) {
  let isKnown = false;
  connections.forEach((connection) => {
    if (connection.from === from && connection.ws === ws) {
      isKnown = true;
    }
  });
  if (!isKnown) {
    console.log(`new connection from ${from}`);
    connections.push({ from, ws });
  } else {
    console.log(`existing connection from ${from}`);
  }
  console.log(`there are now ${connections.length} connections`);
}

function removeConn(ws) {
  for (let idx = connections.length - 1; idx >= 0; idx--) {
    if (connections[idx].ws === ws) {
      // Remove this item
      connections.splice(idx, 1);
    }
  }
  console.log(`there are now ${connections.length} connections`);
}

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_FILE),
  cert: fs.readFileSync(process.env.SSL_CERT_FILE)
};
const port = process.env.PORT;
const exp = express();
const server = https.createServer(options, exp);

const { app /*, getWss, applyTo */ } = expressWs(exp, server);

app.get('/', (req, res) => {
  res.status(200).send('Welcome to our app');
});

app.ws('/ws', async function (ws, req) {
  const from = `${req.socket.remoteAddress}:${req.socket.remotePort}`;

  addConn(from, ws);

  ws.addEventListener('close', () => {
    console.log(`from: ${from} is outta here!`);
    removeConn(ws);
  });

  ws.addEventListener('message', (e) => {
    const msg = e.data;
    console.log(`from: ${from} msg: ${JSON.stringify(msg)}`);

    const obj = JSON.parse(msg);
    connections.forEach((connection) => {
      if (connection.ws.readyState === ws.OPEN) {
        connection.ws.send(JSON.stringify({ data: obj }));
      }
    });
  });
});

server.listen(port);
console.log(`started server, url: https://localhost:${port}`);

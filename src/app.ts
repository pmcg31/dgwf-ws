import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import https from 'https';
import http from 'http';
import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import * as ws from 'ws';
import { acceptConnection } from './conn-manager';

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_FILE as fs.PathLike),
  cert: fs.readFileSync(process.env.SSL_CERT_FILE as fs.PathLike)
};
const port = Number(process.env.LOCAL_PORT);
const hostname = process.env.LOCAL_HOSTNAME;
const sslEnable =
  process.env.SSL_ENABLE && process.env.SSL_ENABLE.toLowerCase() === 'true';
const exp = express();

let server = null;
if (sslEnable) {
  server = https.createServer(options, exp);
} else {
  server = http.createServer(exp);
}

const { app /*, getWss, applyTo */ } = expressWs(exp, server);

app.get('/', (req: Request, res: Response) => {
  res.status(200).send("This is not the page you're looking for");
});

app.ws('/ws', async function (ws: ws.WebSocket, req: Request) {
  acceptConnection(
    req.socket.remoteAddress as string,
    req.socket.remotePort as number,
    ws
  );
});

if (sslEnable) {
  server.listen(port, hostname);
  console.log(`started server, url: https://${hostname}:${port}`);
} else {
  server.listen(port, hostname);
  console.log(`started server, url: http://${hostname}:${port}`);
}

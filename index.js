const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Crear servidor HTTP basado en express, nos permitirá la integración de WebSocket
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware para inyectar `io` en `req.app`
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

const morgan = require("morgan");
const cors = require("cors");

app.use(morgan());
app.use(cors());
app.use(express.json());

const tempsRouter = require('./src/routers/temp.controller');
app.use('/temperatures',tempsRouter);

// WebSocket: manejar conexiones entrantes
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado vía WebSocket');
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado');
  });
});

server.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})
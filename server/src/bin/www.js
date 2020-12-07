import express from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { Server } from 'http';
import iio from 'socket.io';




const app = express();
const server = Server(app)
const io = iio(server)

app.use(cors({
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200,
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {

    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    })
    socket.on('leave-room', () => {
      socket.leave(roomId);
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    })
    socket.on('mute', (value) => {
      socket.to(roomId).broadcast.emit('user-mute', value);
    })
    socket.on('stop-sharing', () => {
      socket.to(roomId).broadcast.emit('stop-sharing', userId);
    })
  })
})

server.listen(
  { port: 8888 },
  () => console.log(`🚀 Server ready at http://localhost:8888`),
);

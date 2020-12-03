import express from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { Server } from 'http';
import iio from 'socket.io';
const { ExpressPeerServer } = require('peer');




const app = express();
const server = Server(app)
const io = iio(server)
// const peerServer = ExpressPeerServer(server, {
//   path: '/myapp'
// });

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:2222", "http://192.168.0.27:8888"],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTION'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200,
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// app.use('/peerjs', peerServer);


io.on('connection', socket => {
  // socket.on('send-offer-to-server', offer => {
  //   socket.broadcast.emit('send-offer-to-clients', offer);
  // })
  // socket.on('send-answer-to-server', answer => {
  //   socket.broadcast.emit('send-answer-to-clients', answer);
  // })
  // socket.on('send-ice-candidate-to-server', candidate => {
  //   socket.broadcast.emit('send-ice-candidate-to-clients', candidate);
  // })
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

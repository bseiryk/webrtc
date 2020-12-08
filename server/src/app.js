import express from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { Server } from 'http';
import iio from 'socket.io';

const PORT = process.env.PORT || 8888;


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

app.use('/resources', express.static(path.resolve(__dirname) + "/build"));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname) + "/build/index.html");
});


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
console.log(PORT)
server.listen(
  { port: PORT },
  () => console.log(`🚀 Server ready at http://localhost:${PORT}`),
);

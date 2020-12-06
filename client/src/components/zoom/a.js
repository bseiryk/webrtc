import React, { useRef, useState } from 'react'
import io from 'socket.io-client';
import Peer from 'peerjs';

import './styles.css';

const id = Date.now()
const peers = {}

const socket = io('http://192.168.0.27:8888/');

const constraints = {
  'video': true,
  'audio': true,
}

// for commit

socket.on('user-disconnected', (id) => {
  if (peers[id]) peers[id].close()
});

const Zoom = () => {
  const appNode = useRef()
  const [roomId, setRoomId] = useState('4423');

  const embadeVideoInDocument = (stream) => {
    const video = document.createElement('video')
    video.muted = true
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    appNode.current.append(video)
    return video
  }

  const openMediaDevices = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    embadeVideoInDocument(stream)
    peers[id] = id;
    return stream;
  }


  const usersConnectionsHandler = (myPeer, stream) => {
    socket.on('user-connected', (userId) => {
      const call = myPeer.call(userId, stream);
      let video;
      call.on('stream', (userStream) => {

        video = embadeVideoInDocument(userStream)
      })
      call.on('close', () => {
        video.remove()
        delete peers[id]
      })
      peers[userId] = call;
    })
  }

  const pearSubscribtionsHandler = (myPeer, stream) => {
    myPeer.on('open', id => {
      socket.emit('join-room', roomId, id)
    })

    myPeer.on('call', call => {
      call.answer(stream)
      call.on('stream', userStream => {
        console.log('pearSubscribtionsHandler')
        embadeVideoInDocument(userStream)
      })
    })
  }


  const callHandler = async () => {
    if (peers[id] || !socket.connected) return;

    const stream = await openMediaDevices();

    const myPeer = new Peer(id, { host: '/', port: '3001' })
    pearSubscribtionsHandler(myPeer, stream)
    usersConnectionsHandler(myPeer, stream)
  }
  return (
    <div className='app' ref={appNode}>
      <div>
        <button onClick={callHandler}>join room</button>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
      </div>
    </div>
  )
}

export default Zoom

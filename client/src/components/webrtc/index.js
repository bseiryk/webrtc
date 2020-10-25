import React from 'react'
import io from 'socket.io-client';

import {
  sendAnswerToClients,
  sendOfferToClients,
  sendIceCandidateToClients,
  iceCandidateHandler,
  connectionStateChangeHandler,
  trackHandler,
} from './apiCalls';

import CONFIG from './config';

const userId = String(Date.now())





class WebRTC extends React.PureComponent {
  constructor(props) {
    super(props);
    this.appNode = React.createRef();
    this.remoteClients = {}
    this.isOpenedDevice = false;
  }


  embadeVideoInDocument = (stream, videoEl) => {
    videoEl.muted = true
    videoEl.srcObject = stream;
    videoEl.addEventListener('loadedmetadata', () => {
      videoEl.play()
    })
    this.appNode.current.append(videoEl)
  }


  openMediaDevices = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia(CONFIG.constraints)
    localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, localStream);
    });
    const video = document.createElement('video')
    // this.embadeVideoInDocument(localStream, video)
  }


  makeCall = async () => {
    const offer = await this.peerConnection.createOffer(CONFIG.offerConfig);
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('send-offer-to-server', offer)
  }


  callHandler = async () => {
    await this.openMediaDevices();
    this.makeCall()
  }


  componentDidMount() {
    const socket = io(CONFIG.socketUrl)
    this.socket = socket
    socket.on('connect', () => {
      socket.on('send-answer-to-clients', sendAnswerToClients.bind(this));
      socket.on('send-offer-to-clients', sendOfferToClients.bind(this));
      socket.on('send-ice-candidate-to-clients', sendIceCandidateToClients.bind(this));
    })


    this.peerConnection = new RTCPeerConnection(CONFIG.pearConfig);
    this.peerConnection.addEventListener('icecandidate', iceCandidateHandler.bind(this));
    this.peerConnection.addEventListener('connectionstatechange', connectionStateChangeHandler.bind(this));
    this.peerConnection.addEventListener('track', trackHandler.bind(this));
  }

  render() {
    return (
      <div className='app' ref={this.appNode}>
        <div>
          <button onClick={this.callHandler}>join room</button>
          {/* <input value={roomId} onChange={(e) => setRoomId(e.target.value)} /> */}
        </div>
      </div>
    )
  }
}

export default WebRTC
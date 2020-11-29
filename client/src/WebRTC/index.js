import React from 'react'
import io from 'socket.io-client';
import classnames from 'classnames';
import Peer from 'peerjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhoneSquare, faPhone } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuidv4 } from 'uuid';


import CallScreen from './CallScreen';
import CONFIG from './config';

import './index.css';

const getRoomID = () => {
  const pathName = window.location.pathname.split('/');
  return pathName[1] || '';
}

const createPartisipantElement = (stream, id, isLocal) => {
  const container = document.createElement('div');
  container.classList.add('partisipant');
  container.id = id;

  const videoElement = document.createElement('video');
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play()
  });
  videoElement.srcObject = stream;
  videoElement.muted = true;

  const audioIcon = document.createElement('span');
  audioIcon.classList.add('fa', 'fa-microphone-slash');

  const videoIcon = document.createElement('span');
  videoIcon.classList.add('fa', 'fa-video-slash');

  const bottomPanel = document.createElement('div');
  bottomPanel.classList.add('options-wrapper');
  bottomPanel.append(audioIcon, videoIcon);

  container.append(videoElement, bottomPanel);

  return container;
}

const addMutesForItem = (value) => {
  const { userId, isMuteAudio, isMuteVideo } = value;

  const audioElement = document.querySelector(`#${userId} .fa-microphone-slash`);
  const videoElement = document.querySelector(`#${userId} .fa-video-slash`);

  const audioMethod = isMuteAudio ? 'add' : 'remove';
  const videoMethod = isMuteVideo ? 'add' : 'remove';

  audioElement.classList[audioMethod]('red');
  videoElement.classList[videoMethod]('red');
}

const USER_ID = `id_${Date.now()}_${uuidv4()}`;

// peerjs --port 9000

class WebRTC extends React.PureComponent {
  constructor(props) {
    super(props);
    this.partisipantsNode = null;
    this.shareScreenNode = null;

    this.localStream = null;
    this.isMuteVideo = false;
    this.isMuteAudio = false;

    this.remoteStreams = {}
    this.calls = {}


    this.state = {
      roomID: getRoomID(),
      isJoined: false,
    }
  }

  embadeItemToPartisipantsSection = element => {
    this.partisipantsNode.append(element)
  }


  openMediaDevices = async () => {
    if (this.localStream) return this.localStream;
    const localStream = await navigator.mediaDevices.getUserMedia(CONFIG.constraints);
    this.localStream = localStream;
    const element = createPartisipantElement(localStream, USER_ID, true);
    this.embadeItemToPartisipantsSection(element);
    return localStream;
  }

  addNewStreamVideo = (stream, id) => {
    if (this.remoteStreams[id]) return;
    this.remoteStreams[id] = stream;
    const element = createPartisipantElement(stream, id);
    this.embadeItemToPartisipantsSection(element);
  }


  onJoinClick = async () => {
    const url = new URL(window.location.origin);
    url.pathname = this.state.roomID;
    window.history.pushState({}, '', url);
    this.joinRoom();
  }

  joinRoom = async () => {
    const roomID = getRoomID();

    if (this.socket && roomID) {
      this.setState({ isJoined: true })
      await this.openMediaDevices();
      this.socket.emit('join-room', roomID, USER_ID);
    }
  }


  componentDidMount() {
    this.peer = new Peer(USER_ID, {
      host: '/',
      port: 9000
    });

    this.socketHandler()
    this.peerHandler()
    this.joinRoom()
  }

  callToUser = async userId => {
    const localStream = await this.openMediaDevices();
    const call = this.peer.call(userId, localStream);
    this.calls[call.peer] = call;

    call.on('stream', remoteStream => {
      this.addNewStreamVideo(remoteStream, call.peer)
    });

    call.on('close', () => {
      const element = document.getElementById(call.peer);
      delete this.calls[call.peer]
      delete this.remoteStreams[call.peer]
      if (element) element.remove();
    })
  }

  socketHandler = () => {
    const socket = io(CONFIG.socketUrl)
    this.socket = socket
    socket.on('connect', () => {
      socket.on('user-connected', userId => {
        this.callToUser(userId);
      });
      socket.on('user-disconnected', userId => {
        const call = this.calls[userId];
        if (call) call.close();
      });
      socket.on('user-mute', value => {
        addMutesForItem(value)
      });
    })
  }

  peerHandler = () => {
    this.peer.on('call', async call => {
      this.calls[call.peer] = call;
      call.answer(this.localStream);

      call.on('stream', remoteStream => {
        this.addNewStreamVideo(remoteStream, call.peer)
      });

      call.on('close', () => {
        const element = document.getElementById(call.peer);
        delete this.calls[call.peer]
        delete this.remoteStreams[call.peer]
        if (element) element.remove();
      })
    });
  }

  onDropCall = () => {
    this.socket.emit('leave-room');
    const url = new URL(window.location.origin);
    window.history.pushState({}, '', url);
    this.partisipantsNode.innerHTML = '';
    this.remoteStreams = {};
    this.calls = {};
    this.localStream.getTracks()
      .forEach(track => track.stop());
    this.localStream = null;
    this.setState({ isJoined: false });
  }

  handleMuteChanges = () => {
    const muteSettings = {
      isMuteVideo: this.isMuteVideo,
      isMuteAudio: this.isMuteAudio,
      userId: USER_ID,
    }

    this.socket.emit('mute', muteSettings);
    addMutesForItem(muteSettings);
  }

  onMuteAudio = isMuteAudio => {
    this.isMuteAudio = isMuteAudio;

    this.localStream.getAudioTracks()
      .forEach(track => track.enabled = !isMuteAudio);

    this.handleMuteChanges();
  }

  onMuteVideo = isMuteVideo => {
    this.isMuteVideo = isMuteVideo;

    this.localStream.getVideoTracks()
      .forEach(track => track.enabled = !isMuteVideo);

    this.handleMuteChanges();
  }


  render() {
    const { isJoined, roomID } = this.state;
    return (
      <div className='app'>
        <div className='join-block'>
          <input
            className='join-room-input'
            value={roomID}
            onChange={(e) => this.setState({ roomID: e.target.value.trim() })}
          />
          <div
            onClick={this.onJoinClick}
            className={classnames('join-room-btn', {
              disabled: !roomID
            })}
          >
            <FontAwesomeIcon icon={faPhoneSquare} />
          </div>
        </div>
        <CallScreen
          isJoined={isJoined}
          onMuteAudio={this.onMuteAudio}
          onMuteVideo={this.onMuteVideo}
          onDropCall={this.onDropCall}
          partisipantsRef={node => this.partisipantsNode = node}
          shareScreenRef={node => this.shareScreenNode = node}
        />
      </div>
    )
  }
}

export default WebRTC
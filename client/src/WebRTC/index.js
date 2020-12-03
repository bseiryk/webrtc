import React from 'react'
import io from 'socket.io-client';
import classnames from 'classnames';
import get from 'lodash/get';
import Peer from 'peerjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhoneSquare, faPhone } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuidv4 } from 'uuid';


import CallScreen from './CallScreen';
import CONFIG from './config';
import {
  createPartisipantElement,
  createScreenShareElement,
  addMutesForPartisipant,
  getRoomID,
} from './utils';

import './index.css';


const USER_ID = `id_${Date.now()}_${uuidv4()}`;

// peerjs --port 9000

class WebRTC extends React.PureComponent {
  constructor(props) {
    super(props);
    this.partisipantsNode = null;
    this.shareScreenNode = null;

    this.localStream = null;
    this.remotScreenShareStream = null;
    this.localScreenShareStream = null;
    this.screenShareCalls = {};
    this.regularCalls = {};
    this.remoteStreams = {};


    this.state = {
      roomID: getRoomID(),
      isJoined: false,
      isMuteAudio: false,
      isMuteVideo: false,
      isSharingScreen: false,
    }
  }


  // work with calls and streams start
  embadeItemToPartisipantsSection = element => this.partisipantsNode.append(element);
  embadeItemToScreenShareSection = element => this.shareScreenNode.append(element);


  openMediaDevices = async () => {
    if (this.localStream) return this.localStream;
    this.localStream = await navigator.mediaDevices.getUserMedia(CONFIG.userConstraints);
    const element = createPartisipantElement(this.localStream, USER_ID, true);
    this.embadeItemToPartisipantsSection(element);
    return this.localStream;
  }


  addNewStreamVideo = (stream, id) => {
    if (this.remoteStreams[id]) return;
    this.remoteStreams[id] = stream;
    const element = createPartisipantElement(stream, id);
    this.embadeItemToPartisipantsSection(element);
  }


  addScreenStreamVideo = stream => {
    if (this.remotScreenShareStream) return;
    this.remotScreenShareStream = stream;
    const element = createScreenShareElement(stream);
    this.embadeItemToScreenShareSection(element);
  }


  addEventsToRegularCall = call => {
    this.regularCalls[call.peer] = call;

    call.on('stream', remoteStream => {
      this.addNewStreamVideo(remoteStream, call.peer);
      this.shareWithMuteSettings();
    });

    call.on('close', () => {
      const element = document.getElementById(call.peer);
      if (element) element.remove();
      delete this.regularCalls[call.peer];
      delete this.remoteStreams[call.peer];
    })
  }


  addEventsToIncomingScreenShareCall = call => {
    this.screenShareCalls[call.peer] = call;

    call.on('stream', remoteStream => {
      this.addScreenStreamVideo(remoteStream);
    });
    call.on('close', () => {
      this.shareScreenNode.innerHTML = '';
      this.remotScreenShareStream = null;
      delete this.screenShareCalls[call.peer];
    })
  }
  // work with calls and streams end


  // initializing calls start
  makeRegularCall = async userId => {
    const localStream = await this.openMediaDevices();
    const call = this.peer.call(userId, localStream);
    this.addEventsToRegularCall(call);
  }


  makeScreenShareCall = userId => {
    if (!this.localScreenShareStream || this.screenShareCalls[userId]) return;

    const call = this.peer.call(
      userId,
      this.localScreenShareStream,
      { metadata: { screenSharing: true } }
    );
    this.screenShareCalls[call.peer] = call;

    call.on('close', () => {
      delete this.screenShareCalls[call.peer];
    })
  }
  // initializing calls end


  socketHandler = () => {
    const socket = io(CONFIG.socketUrl)
    this.socket = socket
    socket.on('connect', () => {
      socket.on('user-connected', userId => {
        this.makeRegularCall(userId);
        this.makeScreenShareCall(userId);

      });
      socket.on('user-disconnected', userId => {
        const call = this.regularCalls[userId];
        const screenShareCall = this.screenShareCalls[userId];
        if (call) call.close();
        if (screenShareCall) screenShareCall.close();
      });
      socket.on('user-mute', value => {
        addMutesForPartisipant(value);
      });
      socket.on('stop-sharing', userId => {
        const screenShareCall = this.screenShareCalls[userId];
        if (screenShareCall) screenShareCall.close();
      });
    })
  }


  peerHandler = () => {
    this.peer.on('call', async call => {
      const isScreenSharing = get(call, 'metadata.screenSharing');

      if (isScreenSharing) {
        call.answer();
        this.addEventsToIncomingScreenShareCall(call);
      } else {
        call.answer(this.localStream);
        this.addEventsToRegularCall(call);
      }

    });
  }


  onDropCall = () => {
    this.socket.emit('leave-room');
    const url = new URL(window.location.origin);
    window.history.pushState({}, '', url);

    this.localStream.getTracks().forEach(track => track.stop());
    if (this.localScreenShareStream) {
      this.localScreenShareStream.getTracks().forEach(track => track.stop());
    }

    this.partisipantsNode.innerHTML = '';
    this.shareScreenNode.innerHTML = '';
    this.remoteStreams = {};
    this.regularCalls = {};
    this.screenShareCalls = {};
    this.localStream = null;
    this.remotScreenShareStream = null;
    this.localScreenShareStream = null;

    this.setState({
      isJoined: false,
      isMuteAudio: false,
      isMuteVideo: false,
      isSharingScreen: false,
    });
  }

  // mute function start
  shareWithMuteSettings = () => {
    const muteSettings = {
      isMuteVideo: this.state.isMuteVideo,
      isMuteAudio: this.state.isMuteAudio,
      userId: USER_ID,
    };
    this.socket.emit('mute', muteSettings);
  }


  handleMuteChanges = () => {
    const { isMuteVideo, isMuteAudio } = this.state;

    const muteSettings = {
      isMuteVideo,
      isMuteAudio,
      userId: USER_ID,
    };

    this.localStream.getTracks()
      .forEach(track => {
        if (track.kind === 'audio') track.enabled = !isMuteAudio;
        if (track.kind === 'video') track.enabled = !isMuteVideo;
      });

    addMutesForPartisipant(muteSettings);
    this.shareWithMuteSettings();
  }


  onMuteAudio = () => {
    this.setState(
      { isMuteAudio: !this.state.isMuteAudio },
      this.handleMuteChanges
    )
  }


  onMuteVideo = () => {
    this.setState(
      { isMuteVideo: !this.state.isMuteVideo },
      this.handleMuteChanges
    )
  }
  // mute function end

  // screen share start
  stopScreenSharing = () => {
    Object.values(this.screenShareCalls)
      .forEach(call => call.close());

    this.screenShareCalls = {};
    this.localScreenShareStream = null;
    this.socket.emit('stop-sharing');
    this.setState({ isSharingScreen: false })
  }


  onShareScreen = async () => {
    const { isSharingScreen } = this.state;
    if (isSharingScreen) return
    if (this.remotScreenShareStream) {
      alert('Other user is sharing')
      return;
    }

    try {
      this.localScreenShareStream = await navigator.mediaDevices
        .getDisplayMedia(CONFIG.screenConstraints);

      this.localScreenShareStream.getVideoTracks()[0].onended = this.stopScreenSharing;
      this.setState({ isSharingScreen: true });
      Object.keys(this.regularCalls)
        .forEach(peerID => this.makeScreenShareCall(peerID))

    } catch (err) {
      console.error("Error: " + err);
    }
  }
  // screen share end


  onKeyDown = e => {
    if (e.keyCode === 13) this.onJoinClick()
  }


  onChange = e => {
    this.setState({ roomID: e.target.value.trim() })
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

    this.socketHandler();
    this.peerHandler();
    this.joinRoom();
  }


  render() {
    const {
      isJoined,
      roomID,
      isMuteAudio,
      isMuteVideo,
      isSharingScreen,
    } = this.state;

    return (
      <div className='app'>
        <div className='join-block'>
          <input
            className='join-room-input'
            value={roomID}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
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
          isMuteAudio={isMuteAudio}
          isMuteVideo={isMuteVideo}
          isSharingScreen={isSharingScreen}
          onMuteAudio={this.onMuteAudio}
          onMuteVideo={this.onMuteVideo}
          onShareScreen={this.onShareScreen}
          onDropCall={this.onDropCall}
          partisipantsRef={node => this.partisipantsNode = node}
          shareScreenRef={node => this.shareScreenNode = node}
        />
      </div>
    )
  }
}

export default WebRTC
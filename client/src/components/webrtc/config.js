export default {
  constraints: {
    'video': true,
    'audio': true,
  },
  pearConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ],
  },
  offerConfig: {
    offerToReceiveAudio: true
  },
  socketUrl: 'http://192.168.0.27:8888/',
}
export default {
  userConstraints: {
    'video': true,
    'audio': {
      echoCancellation: true,
      noiseSuppression: true,
    },
  },
  screenConstraints: {
    video: {
      cursor: 'always',
      displaySurface: 'monitor'
    },
    audio: false,
  },
  socketUrl: 'ws://192.168.0.27:8888/',
}
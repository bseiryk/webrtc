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
  socketUrl: process.env.NODE_ENV === 'development' ? 'ws://192.168.0.27:8888/' : process.env.URL,
}
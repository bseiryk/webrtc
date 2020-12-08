export const createPartisipantElement = (stream, id, isLocal) => {
  const container = document.createElement('div');
  container.classList.add('partisipant');
  container.id = id;

  const videoElement = document.createElement('video');
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play()
  });
  videoElement.srcObject = stream;
  videoElement.muted = isLocal;

  const audioIcon = document.createElement('span');
  audioIcon.classList.add('fa', 'fa-microphone-slash');

  const videoIcon = document.createElement('span');
  videoIcon.classList.add('fa', 'fa-video-slash');

  const bottomPanel = document.createElement('div');
  bottomPanel.classList.add('options-wrapper');
  bottomPanel.append(audioIcon, videoIcon);

  container.append(videoElement, bottomPanel);

  return container;
};


export const createScreenShareElement = stream => {
  const videoElement = document.createElement('video');
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play()
  });
  videoElement.srcObject = stream;
  videoElement.muted = true;

  return videoElement;
}


export const getRoomID = () => {
  const pathName = window.location.pathname.split('/');
  return pathName[1] || '';
}


export const addMutesForPartisipant = value => {
  const { userId, isMuteAudio, isMuteVideo } = value;

  const audioElement = document.querySelector(`#${userId} .fa-microphone-slash`);
  const videoElement = document.querySelector(`#${userId} .fa-video-slash`);

  const audioMethod = isMuteAudio ? 'add' : 'remove';
  const videoMethod = isMuteVideo ? 'add' : 'remove';

  if (audioElement) audioElement.classList[audioMethod]('red');
  if (videoElement) videoElement.classList[videoMethod]('red');
}
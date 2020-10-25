export async function sendAnswerToClients(answer) {
  const remoteDesc = new RTCSessionDescription(answer);
  await this.peerConnection.setRemoteDescription(remoteDesc);
}


export async function sendOfferToClients(offer) {
  if (!this.isOpenedDevice) {
    this.isOpenedDevice = true;
    await this.openMediaDevices();
  }

  const remoteDesc = new RTCSessionDescription(offer);
  await this.peerConnection.setRemoteDescription(remoteDesc);
  const answer = await this.peerConnection.createAnswer();
  await this.peerConnection.setLocalDescription(answer);

  this.socket.emit('send-answer-to-server', answer)
}


export async function sendIceCandidateToClients(iceCandidate) {
  try {
    await this.peerConnection.addIceCandidate(iceCandidate);
  } catch (e) {
    console.error('Error adding received ice candidater', e);
  }
}


export async function iceCandidateHandler(event) {
  if (event.candidate) {
    this.socket.emit('send-ice-candidate-to-server', event.candidate)
  }
}


export async function connectionStateChangeHandler(event) {
  if (this.peerConnection.connectionState === 'connected') {
    console.log('connected')
  }
}

export async function trackHandler(event) {
  console.log(event)
  for (const stream of event.streams) {
    const clientDomEl = this.remoteClients[stream.id];
    if (clientDomEl) {
      // clientDomEl.srcObject = stream;
    } else {
      const video = document.createElement('video')
      this.embadeVideoInDocument(stream, video)
      this.remoteClients[stream.id] = video
    }
  }
}
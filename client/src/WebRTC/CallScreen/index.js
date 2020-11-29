import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faMicrophoneSlash, faVideoSlash, faDesktop } from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames'

import './index.css'


const CallScreen = (props) => {
  const {
    isJoined,
    partisipantsRef,
    shareScreenRef,
    onDropCall,
    onMuteAudio,
    onMuteVideo,
  } = props;

  const [isMuteAudio, setMuteAudio] = useState(false);
  const [isMuteVideo, setMuteVideo] = useState(false);

  const handleMuteAudio = () => {
    setMuteAudio(!isMuteAudio);
    onMuteAudio(!isMuteAudio)
  }
  const handleMuteVideo = () => {
    setMuteVideo(!isMuteVideo);
    onMuteVideo(!isMuteVideo)
  }
  const handleShareScreen = () => {

  }

  return (
    <div
      className='call-screen'
      className={classnames('call-screen', {
        'show-call-window': isJoined,
      })}
    >
      <div
        className='main'
      >
        <div className='header'>
          <div
            className='btn red'
            onClick={onDropCall}
          >
            <FontAwesomeIcon icon={faPhone} />
          </div>
          <div
            className={classnames('btn', { red: isMuteAudio })}
            onClick={handleMuteAudio}
          >
            <FontAwesomeIcon icon={faMicrophoneSlash} />
          </div>
          <div
            className={classnames('btn', { red: isMuteVideo })}
            onClick={handleMuteVideo}
          >
            <FontAwesomeIcon icon={faVideoSlash} />
          </div>
          <div
            className={classnames('btn')}
            onClick={handleShareScreen}
          >
            <FontAwesomeIcon icon={faDesktop} />
          </div>
        </div>
        <div
          ref={shareScreenRef}
          className='main-stream'
        ></div>
      </div>
      <div
        className='partisipants-container'
        ref={partisipantsRef}
      >
      </div>
    </div>
  )
}

export default CallScreen;

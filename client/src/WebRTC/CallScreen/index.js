import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faMicrophoneSlash, faVideoSlash, faDesktop } from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames'

import './index.css'


const CallScreen = (props) => {
  const {
    isMuteAudio,
    isMuteVideo,
    isSharingScreen,
    isJoined,
    partisipantsRef,
    shareScreenRef,
    onDropCall,
    onMuteAudio,
    onMuteVideo,
    onShareScreen,
  } = props;

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
            onClick={onMuteAudio}
          >
            <FontAwesomeIcon icon={faMicrophoneSlash} />
          </div>
          <div
            className={classnames('btn', { red: isMuteVideo })}
            onClick={onMuteVideo}
          >
            <FontAwesomeIcon icon={faVideoSlash} />
          </div>
          <div
            className={classnames('btn', { disabled: isSharingScreen })}
            onClick={onShareScreen}
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

import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';
import { useCallback, useState } from 'react';
import { useDaily, DailyAudio } from '@daily-co/daily-react';
import { AudioWaveform } from './AudioWaveform';

function ConversationViewContent() {
  const [_callState, participants] = useCallState();
  const callObject = useDaily();
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleMute = useCallback(() => {
    if (!callObject) return;

    const newMutedState = !isMuted;
    callObject.setLocalAudio(!newMutedState);
    setIsMuted(newMutedState);
  }, [callObject, isMuted]);

  const toggleScreenShare = useCallback(async () => {
    if (!callObject) return;

    try {
      if (isScreenSharing) {
        await callObject.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await callObject.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (e) {
      console.error('Error toggling screen share:', e);
      // Reset state in case of error
      setIsScreenSharing(false);
    }
  }, [callObject, isScreenSharing]);

  return (
    <div>
      <DailyAudio
        onPlayFailed={(e) => {
          console.error('Audio playback failed:', e);
        }}
      />

      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
        {participants.map((participant) => (
          <div key={participant.session_id}>
            <div>{participant.local ? 'You' : 'Bot'}</div>
            <AudioWaveform
              sessionId={participant.session_id}
              label={participant.local ? 'You' : 'Bot'}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={toggleMute}>
          {isMuted ? 'Unmute' : 'Mute'} Microphone
        </button>

        <button onClick={toggleScreenShare}>
          {isScreenSharing ? 'Stop' : 'Start'} Screen Share
        </button>
      </div>

      {participants.map((participant) => (
        <div key={participant.session_id}>
          {JSON.stringify(
            {
              local: participant.local,
              session_id: participant.session_id,
              user_id: participant.user_id,
            },
            null,
            2,
          )}
        </div>
      ))}
    </div>
  );
}

export function ConversationView(props: { url: string }) {
  return (
    <DailyProvider url={props.url}>
      <ConversationViewContent />
    </DailyProvider>
  );
}

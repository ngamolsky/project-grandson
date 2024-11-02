import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';
import { useCallback, useState } from 'react';
import { useDaily, DailyAudio } from '@daily-co/daily-react';

function ConversationViewContent() {
  const [_callState, participants] = useCallState();
  const callObject = useDaily();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    if (!callObject) return;

    const newMutedState = !isMuted;
    callObject.setLocalAudio(!newMutedState);
    setIsMuted(newMutedState);
  }, [callObject, isMuted]);

  return (
    <div>
      <DailyAudio
        onPlayFailed={(e) => {
          console.error('Audio playback failed:', e);
        }}
      />

      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'} Microphone
      </button>

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

import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';
import { useCallback, useState } from 'react';
import { useDaily, DailyAudio, useDailyEvent } from '@daily-co/daily-react';
import { AudioWaveform } from './AudioWaveform';

type Message = {
  role: 'USER' | 'ASSISTANT';
  content: string;
};

function ConversationViewContent(props: { onEnd: () => void }) {
  const [_callState, participants] = useCallState();
  const callObject = useDaily();
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<Array<Message>>([]);

  useDailyEvent(
    'app-message',
    useCallback((event) => {
      const data = event.data as Record<string, unknown>;
      if (data.label === 'rtvi-ai') {
        const { text } = Object(data.data);
        if (data.type === 'user-transcription') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'USER', content: String(text) },
          ]);
        } else if (data.type === 'bot-transcription') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'ASSISTANT', content: String(text) },
          ]);
        }
      }
      console.log('Received app message:', {
        fromId: event.fromId,
        data: data,
      });
    }, []),
  );

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

  const endCall = useCallback(() => {
    if (!callObject) return;
    callObject.leave();
    props.onEnd();
  }, [callObject]);

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
            <AudioWaveform
              sessionId={participant.session_id}
              label={participant.local ? 'You' : 'Bot'}
            />
          </div>
        ))}
      </div>

      <div>
        {messages.map((message, index) => (
          <div key={index}>
            <strong>{message.role}:</strong> {message.content}
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

        <button
          onClick={endCall}
          style={{ backgroundColor: '#ff4444', color: 'white' }}
        >
          End Call
        </button>
      </div>
    </div>
  );
}

export function ConversationView(props: { url: string; onEnd: () => void }) {
  return (
    <DailyProvider url={props.url}>
      <ConversationViewContent onEnd={props.onEnd} />
    </DailyProvider>
  );
}

import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';
import { useCallback, useState } from 'react';
import { useDaily, DailyAudio, useDailyEvent } from '@daily-co/daily-react';
import { AudioWaveform } from './AudioWaveform';
import { Mic, MicOff, MonitorUp, MonitorStop, PhoneOff } from 'lucide-react';

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
    <div className="p-4">
      <DailyAudio
        onPlayFailed={(e) => {
          console.error('Audio playback failed:', e);
        }}
      />

      <div className="flex gap-3">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          {isScreenSharing ? (
            <MonitorStop className="w-5 h-5" />
          ) : (
            <MonitorUp className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={endCall}
          className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-5 mb-4">
        {participants.map((participant) => (
          <div key={participant.session_id}>
            <AudioWaveform
              sessionId={participant.session_id}
              label={participant.local ? 'Me' : 'Bot'}
            />
          </div>
        ))}
      </div>

      <div className="mb-4 space-y-2">
        {messages.map((message, index) => (
          <div key={index} className="p-2 rounded bg-gray-100">
            <strong className="text-gray-700">{message.role}:</strong>{' '}
            <span className="text-gray-900">{message.content}</span>
          </div>
        ))}
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

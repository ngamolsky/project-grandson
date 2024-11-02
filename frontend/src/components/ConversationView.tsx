import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';
import { useCallback, useState } from 'react';
import { useDaily, DailyAudio, useAppMessage } from '@daily-co/daily-react';
import { AudioWaveform } from './AudioWaveform';
import {
  Mic,
  MicOff,
  MonitorUp,
  MonitorStop,
  PhoneOff,
  SendHorizontal,
} from 'lucide-react';

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

  const sendAppMessage = useAppMessage({
    onAppMessage: (event: {
      data: Record<string, unknown>;
      fromId: string;
    }) => {
      const data = event.data;
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
    },
  });

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
    <div className="p-4 flex-1 h-screen overflow-hidden flex flex-col">
      <DailyAudio
        onPlayFailed={(e) => {
          console.error('Audio playback failed:', e);
        }}
      />

      <div className="flex gap-3 justify-center">
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

      <div className="flex flex-col mb-4">
        {participants.map((participant) => (
          <AudioWaveform
            key={participant.session_id}
            sessionId={participant.session_id}
            label={participant.local ? 'Me' : 'Claude'}
          />
        ))}
      </div>

      <div className="flex justify-end pb-2">
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-sm hover:underline"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`px-3 py-2 rounded-lg max-w-[80%] mb-2 ${
              message.role === 'USER'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-100 mr-auto'
            }`}
          >
            <span
              className={
                message.role === 'USER' ? 'text-white' : 'text-gray-900'
              }
            >
              {message.content}
            </span>
          </div>
        ))}
      </div>

      <ChatInput
        onSend={(message) => {
          sendAppMessage({ message }, '*');
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'USER', content: message },
          ]);
        }}
      />
    </div>
  );
}

function ChatInput({ onSend }: { onSend: (message: string) => void }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="flex gap-2 border-t border-gray-200 pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(message);
        setMessage('');
      }}
    >
      <input
        type="text"
        className="flex-1 px-4"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
      >
        <SendHorizontal />
      </button>
    </form>
  );
}

export function ConversationView(props: { url: string; onEnd: () => void }) {
  return (
    <DailyProvider url={props.url}>
      <ConversationViewContent onEnd={props.onEnd} />
    </DailyProvider>
  );
}

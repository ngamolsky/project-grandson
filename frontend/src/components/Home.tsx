import { useState } from 'react';
import { ConversationView } from './ConversationView';
import { ROOM_URL } from '../support/constants';

type ConversationState =
  | {
      name: 'IDLE';
    }
  | {
      name: 'STARTING';
    }
  | {
      name: 'ERROR_STARTING_CONVERSATION';
      error: string;
    }
  | {
      name: 'STARTED';
      url: string;
    }
  | {
      name: 'ENDED';
    };

export function Home() {
  const [conversationState, setConversationState] = useState<ConversationState>(
    { name: 'IDLE' },
  );

  if (conversationState.name === 'ERROR_STARTING_CONVERSATION') {
    return (
      <div className="p-4">
        <p>Error starting conversation: {conversationState.error}</p>
      </div>
    );
  }

  if (conversationState.name !== 'STARTED') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <button
          disabled={conversationState.name === 'STARTING'}
          onClick={async () => {
            setConversationState({ name: 'STARTING' });
            try {
              setConversationState({ name: 'STARTED', url: ROOM_URL });
            } catch (error) {
              setConversationState({
                name: 'ERROR_STARTING_CONVERSATION',
                error: String(error),
              });
            }
          }}
          className={`px-6 py-3 text-lg font-medium text-white rounded-lg transition-colors
          ${
            conversationState.name === 'STARTING'
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {conversationState.name === 'STARTING' ? 'Starting...' : 'Start'}
        </button>
      </div>
    );
  }

  return (
    <ConversationView
      url={conversationState.url}
      onEnd={() => {
        setConversationState({ name: 'IDLE' });
      }}
    />
  );
}

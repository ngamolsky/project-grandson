import { useState } from 'react';
import { ConversationView } from './ConversationView';

const roomUrl = 'https://sstur.daily.co/simon-new-2';

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
      <div style={{ padding: '16px' }}>
        <p>Error starting conversation: {conversationState.error}</p>
      </div>
    );
  }

  if (conversationState.name !== 'STARTED') {
    return (
      <div>
        <button
          disabled={conversationState.name === 'STARTING'}
          onClick={async () => {
            setConversationState({ name: 'STARTING' });
            try {
              setConversationState({ name: 'STARTED', url: roomUrl });
            } catch (error) {
              setConversationState({
                name: 'ERROR_STARTING_CONVERSATION',
                error: String(error),
              });
            }
          }}
        >
          Start Conversation
        </button>
      </div>
    );
  }

  return (
    <div>
      <ConversationView
        url={conversationState.url}
        onEnd={() => {
          setConversationState({ name: 'IDLE' });
        }}
      />
    </div>
  );
}

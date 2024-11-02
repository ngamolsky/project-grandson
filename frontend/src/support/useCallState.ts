import {
  DailyMeetingState as CallState,
  DailyEvent,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { useDaily } from '@daily-co/daily-react';
import { useEffect, useState } from 'react';
import { getParticipantList } from './getParticipantList';

const callStateEvents = [
  'loading',
  'loaded',
  'joining-meeting',
  'joined-meeting',
  'left-meeting',
  'error',
] as const satisfies Array<DailyEvent>;

const participantStateEvents = [
  'participant-joined',
  'participant-updated',
] as const satisfies Array<DailyEvent>;

// Adapted from https://github.com/daily-demos/call-object-react/blob/5a5092e/src/components/App/App.js
export function useCallState() {
  const callObject = useDaily();
  const [callState, setCallState] = useState<CallState>(() => {
    return callObject?.meetingState() ?? 'new';
  });
  const [participants, setParticipants] = useState(() => {
    return getParticipantList(callObject);
  });

  useEffect(() => {
    if (!callObject) return;

    const onMeetingStateChange = () => {
      const callState = callObject.meetingState();
      setCallState(callState);
    };

    const onParticipantChange = () => {
      setParticipants(getParticipantList(callObject));
    };

    const onAppMessage = (event: DailyEventObjectAppMessage) => {
      console.log('app-message', event.data);
    };

    for (const event of callStateEvents) {
      callObject.on(event, onMeetingStateChange);
    }

    for (const event of participantStateEvents) {
      callObject.on(event, onParticipantChange);
    }

    callObject.on('app-message', onAppMessage);

    return () => {
      for (const event of callStateEvents) {
        callObject.off(event, onMeetingStateChange);
      }
      for (const event of participantStateEvents) {
        callObject.off(event, onParticipantChange);
      }
      callObject.off('app-message', onAppMessage);
    };
  }, [callObject]);

  return [callState, participants] as const;
}

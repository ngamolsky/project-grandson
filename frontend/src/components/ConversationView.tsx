import { DailyProvider } from '../providers/DailyProvider';
import { useCallState } from '../support/useCallState';

// function getRemoteStream(
//   callObject: DailyCall | null,
// ): [MediaStreamTrack | undefined, MediaStreamTrack | undefined] {
//   const participants = getParticipantList(callObject);
//   for (const participant of participants) {
//     if (participant.local) continue;
//     const audioTrack = participant.tracks.audio.persistentTrack;
//     const videoTrack = participant.tracks.video.persistentTrack;
//     if (audioTrack && videoTrack) {
//       return [audioTrack, videoTrack] as const;
//     }
//   }
//   return [undefined, undefined];
// }

function ConversationViewContent() {
  const [_callState, participants] = useCallState();

  return (
    <div>
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

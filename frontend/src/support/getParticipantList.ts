import { DailyCall, DailyParticipant } from '@daily-co/daily-js';

export function getParticipantList(callObject: DailyCall | null) {
  const participantListObject: Record<string, DailyParticipant> =
    callObject?.participants() ?? {};
  return Object.values(participantListObject);
}

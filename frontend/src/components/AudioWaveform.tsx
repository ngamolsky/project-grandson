import { useAudioLevelObserver } from '@daily-co/daily-react';
import { useCallback, useRef } from 'react';

interface AudioWaveformProps {
  sessionId: string;
  label: string;
}

export function AudioWaveform({ sessionId, label }: AudioWaveformProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useAudioLevelObserver(
    sessionId,
    useCallback((volume: number) => {
      if (barRef.current) {
        // Convert volume to percentage and ensure minimum visibility
        const width = Math.max(2, volume * 100);
        barRef.current.style.width = `${width}%`;

        // Adjust opacity for better visual feedback
        barRef.current.style.opacity = `${Math.max(0.3, volume)}`;
      }
    }, []),
  );

  return (
    <div className="flex items-center gap-3 my-3">
      <div className="min-w-[80px] font-medium text-gray-800">{label}</div>
      <div className="flex-1 h-6 bg-gray-900 rounded overflow-hidden p-[3px] shadow-inner">
        <div
          ref={barRef}
          className="h-full w-[2%] bg-gradient-to-r from-green-400 to-green-600 rounded-sm transition-all duration-100 ease-out shadow-[0_0_8px_rgba(0,255,136,0.5)]"
        />
      </div>
    </div>
  );
}

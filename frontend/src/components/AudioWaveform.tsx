import { useAudioLevel, useAudioTrack } from '@daily-co/daily-react';
import { useCallback, useRef } from 'react';

interface AudioWaveformProps {
  sessionId: string;
  label: string;
}

export function AudioWaveform({ sessionId, label }: AudioWaveformProps) {
  const audioTrack = useAudioTrack(sessionId);
  const barRef = useRef<HTMLDivElement>(null);

  useAudioLevel(
    audioTrack?.persistentTrack,
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
    <div className="audio-waveform">
      <div className="label">{label}</div>
      <div className="indicator-container">
        <div className="indicator-bar" ref={barRef} />
      </div>
      <style>{`
        .audio-waveform {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
        }
        
        .label {
          min-width: 80px;
          font-weight: 500;
          color: #2d2d2d;
        }

        .indicator-container {
          width: 300px;
          height: 24px;
          background: #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
          padding: 3px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .indicator-bar {
          width: 2%;
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00cc6f);
          border-radius: 2px;
          transition: all 0.1s ease-out;
          box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
        }
      `}</style>
    </div>
  );
}

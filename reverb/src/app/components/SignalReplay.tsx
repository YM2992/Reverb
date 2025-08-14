import React, { useState } from 'react';
import { Signal } from './SignalList';

interface SignalReplayProps {
  signals: Signal[];
  onReplay: (signals: Signal[]) => void;
}

export default function SignalReplay({ signals, onReplay }: SignalReplayProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Filter signals by time range
  const filteredSignals = signals.filter(signal => {
    if (!start && !end) return true;
    const startTime = start ? new Date(start).getTime() : -Infinity;
    const endTime = end ? new Date(end).getTime() : Infinity;
    return signal.timestamp >= startTime && signal.timestamp <= endTime;
  });

  return (
    <div
      className="mx-auto max-w-lg w-full mt-6 bg-neutral-900 p-4 rounded-lg box-border"
    >
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Replay Signals</h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label style={{ color: '#fff', fontSize: '1em', display: 'flex', flexDirection: 'column', gap: 4 }}>
          Start Time:
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            style={{
              marginTop: 2,
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#232323',
              color: '#fff',
              fontSize: '1em',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ color: '#fff', fontSize: '1em', display: 'flex', flexDirection: 'column', gap: 4 }}>
          End Time:
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            style={{
              marginTop: 2,
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#232323',
              color: '#fff',
              fontSize: '1em',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <button
          onClick={() => onReplay(filteredSignals)}
          style={{
            background: 'linear-gradient(90deg, #007cf0 0%, #00dfd8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '12px 0',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1.1em',
            width: '100%',
            marginTop: 8,
          }}
        >
          Replay
        </button>
      </div>
      <div style={{ color: '#aaa', fontSize: 14, textAlign: 'center' }}>
        {filteredSignals.length} signal(s) selected for replay.
      </div>
    </div>
  );
}

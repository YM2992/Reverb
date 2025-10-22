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
    <div className="mx-auto max-w-lg w-full mt-6 bg-neutral-900 p-4 rounded-lg box-border">
      <h2 className="text-lg mb-3">Replay Signals</h2>
      <div className="flex flex-col gap-3 mb-4">
        <label className="text-white text-base flex flex-col gap-1">
          Start Time:
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="mt-1 px-2 py-2 rounded border border-gray-700 bg-neutral-800 text-white text-base w-full box-border"
          />
        </label>
        <label className="text-white text-base flex flex-col gap-1">
          End Time:
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="mt-1 px-2 py-2 rounded border border-gray-700 bg-neutral-800 text-white text-base w-full box-border"
          />
        </label>
        <button
          onClick={() => onReplay(filteredSignals)}
          className={`border-none rounded-md py-3 font-semibold text-lg w-full mt-2 ${(!start || !end)
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white cursor-pointer"
            }`}
          disabled={!start || !end}
        >
          Replay
        </button>
      </div>
      <div className="text-gray-400 text-sm text-center">
        {filteredSignals.length} signal(s) selected for replay.
      </div>
    </div>
  );
}

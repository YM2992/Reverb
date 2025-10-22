import React, { useEffect, useState } from 'react';

export interface Signal {
  id: string;
  frequency: number;
  data: string;
  rssi: number;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  nickname?: string;
}

interface SignalListProps {
  signals: Signal[];
  onRowClick?: (signal: Signal) => void;
}

const tableContainerStyle: React.CSSProperties = {
  maxHeight: 320,
  overflowY: 'auto',
  margin: '16px 0',
  borderRadius: 8,
  background: '#181818',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'transparent',
  color: '#fff',
};

const thStyle: React.CSSProperties = {
  background: '#232323',
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 700,
  borderBottom: '2px solid #333',
  position: 'sticky',
  top: 0,
  zIndex: 2,
};

const thNarrow: React.CSSProperties = {
  ...thStyle,
  width: 90,
  minWidth: 70,
  maxWidth: 110,
};
const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #333',
  fontFamily: 'monospace',
};
const tdNarrow: React.CSSProperties = {
  ...tdStyle,
  width: 90,
  minWidth: 70,
  maxWidth: 110,
  textAlign: 'right',
};
const tdDate: React.CSSProperties = {
  ...tdStyle,
  fontFamily: 'monospace',
  color: '#b5e0ff',
  fontSize: '0.98em',
  whiteSpace: 'nowrap',
};

export default function SignalList({ signals, onRowClick }: SignalListProps) {
  // Sort signals by timestamp descending (newest first)
  const sortedSignals = [...signals].sort((a, b) => b.timestamp - a.timestamp);

  // Current time state
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-4xl w-full">
      <h2 className="flex items-center justify-between">
        <span>Detected Signals</span>
        <span className="text-base text-gray-400 font-normal">Total: {signals.length}</span>
      </h2>
      <div className="flex justify-start items-center mb-1">
        <span className="text-sky-200 font-mono text-base tracking-wide">{now.toLocaleString()}</span>
      </div>
      <div className="max-h-80 overflow-y-auto my-4 rounded-lg bg-neutral-900">
        <table className="w-full border-collapse bg-transparent text-white">
          <thead>
            <tr>
              <th className="bg-neutral-800 px-3 py-2 text-left font-bold border-b-2 border-gray-700 sticky top-0 z-10">Nickname</th>
              <th className="bg-neutral-800 px-3 py-2 text-left font-bold border-b-2 border-gray-700 sticky top-0 z-10">Timestamp</th>
              <th className="bg-neutral-800 px-2 py-2 text-right font-bold border-b-2 border-gray-700 sticky top-0 z-10 w-24 min-w-[70px] max-w-[110px]">Frequency (MHz)</th>
              <th className="bg-neutral-800 px-3 py-2 text-left font-bold border-b-2 border-gray-700 sticky top-0 z-10">Data</th>
              <th className="bg-neutral-800 px-2 py-2 text-right font-bold border-b-2 border-gray-700 sticky top-0 z-10 w-24 min-w-[70px] max-w-[110px]">RSSI (dBm)</th>
              <th className="bg-neutral-800 px-2 py-2 text-right font-bold border-b-2 border-gray-700 sticky top-0 z-10 w-32 min-w-[90px] max-w-[140px]">Latitude</th>
              <th className="bg-neutral-800 px-2 py-2 text-right font-bold border-b-2 border-gray-700 sticky top-0 z-10 w-32 min-w-[90px] max-w-[140px]">Longitude</th>
              <th className="bg-neutral-800 px-2 py-2 text-center font-bold border-b-2 border-gray-700 sticky top-0 z-10 w-20 min-w-[70px] max-w-[90px]">Map</th>
            </tr>
          </thead>
          <tbody>
            {sortedSignals.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 font-mono py-3">No signals detected.</td>
              </tr>
            ) : (
              sortedSignals.map((signal) => (
                <tr
                  key={signal.id}
                  className={onRowClick ? 'cursor-pointer bg-neutral-800 hover:bg-neutral-700 transition-colors' : ''}
                  onClick={onRowClick ? () => onRowClick(signal) : undefined}
                >
                  <td className="px-3 py-2 font-mono border-b border-gray-700">{signal.nickname ?? '-'}</td>
                  <td className="px-3 py-2 font-mono border-b border-gray-700 text-sky-200 text-sm whitespace-nowrap">{new Date(signal.timestamp).toLocaleString()}</td>
                  <td className="px-2 py-2 font-mono border-b border-gray-700 text-right w-24 min-w-[70px] max-w-[110px]">{signal.frequency}</td>
                  <td className="px-3 py-2 font-mono border-b border-gray-700">{signal.data}</td>
                  <td className="px-2 py-2 font-mono border-b border-gray-700 text-right w-24 min-w-[70px] max-w-[110px]">{signal.rssi}</td>
                  <td className="px-2 py-2 font-mono border-b border-gray-700 text-right w-32 min-w-[90px] max-w-[140px]">
                    {signal.latitude !== undefined
                      ? signal.latitude.toFixed(6)
                      : (now.getTime() - signal.timestamp < 10000 ? '⏳' : '-')}
                  </td>
                <td className="px-2 py-2 font-mono border-b border-gray-700 text-right w-32 min-w-[90px] max-w-[140px]">
                  {signal.longitude !== undefined
                    ? signal.longitude.toFixed(6)
                    : (now.getTime() - signal.timestamp < 10000 ? '⏳' : '-')}
                </td>
                <td className="px-2 py-2 border-b border-gray-700 text-center w-20 min-w-[70px] max-w-[90px]">
                  {(signal.latitude !== undefined && signal.longitude !== undefined) ? (
                    <a
                      href={`https://maps.google.com/?q=${signal.latitude},${signal.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on map"
                      style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}
                      onClick={e => { e.stopPropagation(); }}
                    >
                      Map
                    </a>
                  ) : (
                    <span style={{ color: "#888" }}>-</span>
                  )}
                </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

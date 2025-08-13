import React from 'react';

export interface Signal {
  id: string;
  frequency: number;
  data: string;
  rssi: number;
  timestamp: number;
}

interface SignalListProps {
  signals: Signal[];
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

export default function SignalList({ signals }: SignalListProps) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Detected Signals</span>
        <span style={{ fontSize: '0.95em', color: '#aaa', fontWeight: 400 }}>
          Total: {signals.length}
        </span>
      </h2>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp</th>
              <th style={thNarrow}>Frequency (MHz)</th>
              <th style={thStyle}>Data</th>
              <th style={thNarrow}>RSSI (dBm)</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#aaa' }}>
                  No signals detected.
                </td>
              </tr>
            ) : (
              signals.map((signal) => (
                <tr key={signal.id}>
                  <td style={tdDate}>{new Date(signal.timestamp).toLocaleString()}</td>
                  <td style={tdNarrow}>{signal.frequency}</td>
                  <td style={tdStyle}>{signal.data}</td>
                  <td style={tdNarrow}>{signal.rssi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

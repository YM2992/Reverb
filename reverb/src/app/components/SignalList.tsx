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

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #333',
  fontFamily: 'monospace',
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
              <th style={thStyle}>Frequency (MHz)</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>RSSI (dBm)</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#aaa' }}>
                  No signals detected.
                </td>
              </tr>
            ) : (
              signals.map((signal) => (
                <tr key={signal.id}>
                  <td style={tdStyle}>{signal.frequency}</td>
                  <td style={tdStyle}>{signal.data}</td>
                  <td style={tdStyle}>{signal.rssi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

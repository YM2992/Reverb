import React from "react";
import { Signal } from "./SignalList";

interface SignalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Signal[];
  onClear: () => void;
}

const SignalHistoryModal: React.FC<SignalHistoryModalProps> = ({ isOpen, onClose, history, onClear }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", zIndex: 1000 }}>
      <div className="modal-content" style={{ background: "#232323", color: "#fff", margin: "5vh auto", padding: 24, borderRadius: 12, maxWidth: 800, minHeight: 300, position: "relative", boxShadow: "0 4px 32px #000a" }}>
        <h2 style={{marginTop:0, color:'#fff'}}>Signal History</h2>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: '#232323', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
        <button onClick={onClear} style={{ position: "absolute", top: 12, right: 110, background: '#f0004c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Clear History</button>
        <div style={{ maxHeight: 400, overflowY: "auto", marginTop: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: 'transparent', color: '#fff', fontFamily: 'monospace', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #444", color: '#fff', padding: '6px 8px' }}>Time</th>
                <th style={{ borderBottom: "1px solid #444", color: '#fff', padding: '6px 8px' }}>Frequency (MHz)</th>
                <th style={{ borderBottom: "1px solid #444", color: '#fff', padding: '6px 8px' }}>Data</th>
                <th style={{ borderBottom: "1px solid #444", color: '#fff', padding: '6px 8px' }}>RSSI</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", color: '#aaa', padding: 16 }}>No history</td></tr>
              ) : (
                history.slice().reverse().map((signal, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #333' }}>{signal.timestamp ? new Date(signal.timestamp).toLocaleString() : "-"}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #333' }}>{signal.frequency ?? "-"}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #333' }}>{signal.data}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #333' }}>{signal.rssi ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SignalHistoryModal;

"use client";

import React, { useState, useEffect } from "react";
import { SignalStorage } from "./SignalStorage";
import { BluetoothManager, BluetoothState } from "./BluetoothManager";
import FooterBar from "./FooterBar";
import SignalList, { Signal } from "./SignalList";
import SignalReplay from "./SignalReplay";

function BleWebAppUI({
    state,
    onConnect,
    onDisconnect,
    onWrite
}: {
    state: BluetoothState;
    onConnect: () => void;
    onDisconnect: () => void;
    onWrite: (val: number) => void;
}) {
    const buttonStyle: React.CSSProperties = {
        padding: '10px 20px',
        margin: '0 8px 12px 0',
        border: 'none',
        borderRadius: '6px',
        background: 'linear-gradient(90deg, #007cf0 0%, #00dfd8 100%)',
        color: '#fff',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'background 0.2s, transform 0.1s',
    };
    const buttonDanger: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(90deg, #f0004c 0%, #ff7a18 100%)',
    };
    const buttonOn: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(90deg, #24af37 0%, #24af37 100%)',
    };
    const buttonOff: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(90deg, #d13a30 0%, #ff1818ff 100%)',
    };
    return (
        <div style={{ maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
            <h1>Reverb</h1>
        </div>
    );
}

const BleWebApp: React.FC = () => {
    const [state, setState] = useState<BluetoothState>({
        deviceName: "-",
        bleState: "Disconnected",
        bleStateColor: "#d13a30",
        lastValueReceived: "-",
        lastValueSent: "-",
        connectionEstablishedTimestamp: -1,
        lastReceivedTimestamp: -1,
    });
    const [manager] = useState(() => new BluetoothManager());

    // Load signals from localStorage on mount
    const [signals, setSignals] = useState<Signal[]>(() => SignalStorage.loadSignals());

    // Update signals when new BLE data is received
    useEffect(() => {
        if (!state.lastValueReceived || state.lastValueReceived === '-') return;
        let parsed: any;
        try {
            parsed = JSON.parse(state.lastValueReceived);
        } catch {
            return;
        }
        // Accept both {data, freq, rssi} and {value, freq, rssi, protocol}
        const data = parsed.data !== undefined ? parsed.data : (parsed.value !== undefined ? parsed.value : undefined);
        const frequency = parsed.freq || parsed.frequency;
        const rssi = parsed.rssi;
        if (data === undefined || frequency === undefined || rssi === undefined) return;
        setSignals(prevSignals => {
            // Find by exact data and frequency
            const idx = prevSignals.findIndex(s => s.data === String(data) && s.frequency === Number(frequency));
            let updated;
            if (idx !== -1) {
                // Update RSSI and timestamp
                updated = [...prevSignals];
                updated[idx] = {
                    ...updated[idx],
                    rssi: rssi,
                    timestamp: Date.now(),
                };
            } else {
                // Add new row
                updated = [
                    ...prevSignals,
                    {
                        id: Math.random().toString(36).slice(2),
                        frequency: Number(frequency),
                        data: String(data),
                        rssi: rssi,
                        timestamp: Date.now(),
                    }
                ];
            }
            // Save to localStorage
            SignalStorage.saveSignals(updated);
            return updated;
        });
    }, [state.lastValueReceived]);

    // Handler for replaying signals (replace with real logic as needed)
    const handleReplay = (selectedSignals: Signal[]) => {
        alert(`Replaying ${selectedSignals.length} signal(s):\n` + selectedSignals.map(s => `${s.frequency} MHz, ${s.data}, RSSI: ${s.rssi}`).join('\n'));
    };

    // Clear signals handler
    const handleClearSignals = () => {
        if (window.confirm("Clear all detected signals?")) {
            SignalStorage.clearSignals();
            setSignals([]);
        }
    };

    // Export signals handler
    const handleExportSignals = () => {
        const dataStr = JSON.stringify(signals, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reverb_signals_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    return (
        <div style={{ padding: '20px', marginBottom: '80px' }}>
            <BleWebAppUI
                state={state}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
                onWrite={(val) => manager.writeOnCharacteristic(val, setState)}
            />
            <SignalList signals={signals} />
            <div style={{ display: 'flex', gap: 12, margin: '8px 0 0 0', justifyContent: 'flex-end' }}>
                <button onClick={handleExportSignals} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#007cf0', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Export</button>
                <button onClick={handleClearSignals} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#f0004c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
            </div>
            <SignalReplay signals={signals} onReplay={handleReplay} />
            <FooterBar
                state={state}
                isConnected={state.bleState.includes("Connected")}
                deviceName={state.deviceName}
                lastMessageTimestamp={state.lastReceivedTimestamp}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
            />
        </div>
    );
};

export default BleWebApp;

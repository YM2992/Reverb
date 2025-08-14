"use client";

import React, { useState, useEffect } from "react";
import { SignalStorage } from "./SignalStorage";
import { BluetoothManager, BluetoothState } from "./BluetoothManager";

import FooterBar from "./FooterBar";
import SignalList, { Signal } from "./SignalList";
import SignalReplay from "./SignalReplay";
import Transmit from "./Transmit";
import SignalHistoryModal from "./SignalHistoryModal";

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
    const [bleDisconnected, setBleDisconnected] = useState(false);

    // Load signals from localStorage on mount
    const [signals, setSignals] = useState<Signal[]>(() => SignalStorage.loadSignals());
    const [history, setHistory] = useState<Signal[]>(() => SignalStorage.loadHistory());
    const [showHistory, setShowHistory] = useState(false);

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
        const newSignal: Signal = {
            id: Math.random().toString(36).slice(2),
            frequency: Number(frequency),
            data: String(data),
            rssi: rssi,
            timestamp: Date.now(),
        };
        // Append to history
        SignalStorage.appendToHistory(newSignal);
        setHistory(SignalStorage.loadHistory());
        // Deduplicate for display: only latest per data (and frequency)
        setSignals(prevSignals => {
            const map = new Map<string, Signal>();
            // Add all previous, but overwrite with new
            for (const s of [...prevSignals, newSignal]) {
                map.set(`${s.data}_${s.frequency}`, s);
            }
            const deduped = Array.from(map.values());
            SignalStorage.saveSignals(deduped);
            return deduped;
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
            SignalStorage.clearHistory();
            setSignals([]);
            setHistory([]);
        }
    };
    // Signal history modal as a component
    const handleClearHistory = () => {
        if (window.confirm("Clear all signal history?")) {
            SignalStorage.clearHistory();
            setHistory([]);
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

    // Transmit logic
    const [transmitValue, setTransmitValue] = useState("");


    // --- TX Protocol Implementation ---

    // --- TX Protocol Implementation with timeout and repeat rate ---
    const [txTimeout, setTxTimeout] = useState("5000");
    const [txRepeat, setTxRepeat] = useState("100");

    const handleTransmitOnce = (value: string) => {
        const num = Number(value);
        if (!isNaN(num)) {
            // TX,1,0,0,[data]
            manager.writeStringCommandOnCharacteristic(`TX,1,0,0,${num}`, setState);
        } else {
            window.alert("Please enter a valid number to transmit.");
        }
    };

    const handleStartTransmit = (value: string, timeout: string, repeat: string) => {
        const num = Number(value);
        const t = Number(timeout);
        const r = Number(repeat);
        if (isNaN(num) || isNaN(t) || isNaN(r)) {
            window.alert("Please enter valid numbers for value, timeout, and repeat rate.");
            return;
        }
        // Send TX,2,timeout,repeat_rate,data to start continual transmission
        manager.writeStringCommandOnCharacteristic(`TX,2,${t},${r},${num}`, setState);
    };

    const handleStopTransmit = () => {
        // Send TX,0,0,0,0 to stop continual transmission
        manager.writeStringCommandOnCharacteristic(`TX,0,0,0,0`, setState);
    };

    // Handler for clicking a signal row to auto-fill transmit value
    const handleSignalRowClick = (signal: Signal) => {
        setTransmitValue(signal.data);
    };

    // BLE disconnect detection and visual response using BluetoothManager's handler and actual connection polling
    useEffect(() => {
        manager.onDisconnectHandler(() => {
            setBleDisconnected(true);
        });
        // Poll actual connection every 2 seconds
        setBleDisconnected(!manager.isActuallyConnected());
        const poll = setInterval(() => {
            setBleDisconnected(!manager.isActuallyConnected());
        }, 2000);
        return () => clearInterval(poll);
    }, [manager]);

    return (
        <div style={{ padding: '20px', marginBottom: '80px', position: 'relative' }}>
            {bleDisconnected && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    background: '#d13a30',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    textAlign: 'center',
                    padding: '14px 0',
                    zIndex: 2000,
                    boxShadow: '0 2px 12px #000a',
                    letterSpacing: 1,
                }}>
                    BLE Disconnected. Please reconnect your device.
                </div>
            )}
            <BleWebAppUI
                state={state}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
                onWrite={(val) => manager.writeOnCharacteristic(val, setState)}
            />
            <SignalList signals={signals} onRowClick={handleSignalRowClick} />
            <div style={{ display: 'flex', gap: 12, margin: '8px 0 0 0', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowHistory(true)} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#232323', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>View History</button>
                <button onClick={handleExportSignals} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#007cf0', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Export</button>
                <button onClick={handleClearSignals} style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#f0004c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
            </div>
            <SignalHistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                history={history}
                onClear={handleClearHistory}
            />
            <Transmit
                onTransmit={handleTransmitOnce}
                onStart={handleStartTransmit}
                onStop={handleStopTransmit}
                value={transmitValue}
                setValue={setTransmitValue}
                bleConnected={state.bleState.includes("Connected")}
            />
            <SignalReplay signals={signals} onReplay={handleReplay} />
            <FooterBar
                state={state}
                isConnected={!bleDisconnected}
                deviceName={state.deviceName}
                lastMessageTimestamp={state.lastReceivedTimestamp}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
            />
        </div>
    );
};

export default BleWebApp;

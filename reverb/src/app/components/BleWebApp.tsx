"use client";

import React, { useState, useEffect } from "react";
import { SignalStorage } from "./SignalStorage";
import { BluetoothManager, BluetoothState } from "./BluetoothManager";

import FooterBar from "./FooterBar";
import SignalList, { Signal } from "./SignalList";
import SignalReplay from "./SignalReplay";
import Transmit from "./Transmit";
import SignalHistoryModal from "./SignalHistoryModal";
import DisconnectedBanner from "./DisconnectedBanner";

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
    return (
        <div className="mx-auto max-w-2xl font-sans mb-6 px-4 w-full">
            <h1 className="text-center mt-6 mb-4 text-white select-none font-black text-4xl leading-tight tracking-wide relative">
                Reverb
                <span className="block w-full h-2 mt-1 bg-none relative">
                    <svg width="120" height="10" viewBox="0 0 120 10" className="block mx-auto">
                        <polyline
                            points="0,5 10,5 15,2 20,8 25,5 35,5 40,3 45,7 50,5 60,5 65,2 70,8 75,5 85,5 90,3 95,7 100,5 110,5 120,5"
                            fill="none"
                            stroke="#4fd1ff"
                            strokeWidth="2"
                            opacity="0.5"
                        >
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                        </polyline>
                    </svg>
                </span>
            </h1>
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
        type ParsedSignal = {
            data?: string | number;
            value?: string | number;
            freq?: number | string;
            frequency?: number | string;
            rssi?: number;
            protocol?: string;
        };
        let parsed: ParsedSignal;
        try {
            parsed = JSON.parse(state.lastValueReceived) as ParsedSignal;
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
        <div
            className={`mx-auto max-w-3xl w-full relative mb-20 px-4 ${bleDisconnected ? 'mt-16' : ''} transition-all`}
        >
            <DisconnectedBanner show={bleDisconnected} />
            <BleWebAppUI
                state={state}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
                onWrite={(val) => manager.writeOnCharacteristic(val, setState)}
            />
            <SignalList signals={signals} onRowClick={handleSignalRowClick} />
            <div className="flex gap-3 mt-2 justify-end">
                <button onClick={() => setShowHistory(true)} className="px-4 py-1.5 rounded-md border-none bg-neutral-800 text-white font-semibold cursor-pointer">View History</button>
                <button onClick={handleExportSignals} className="px-4 py-1.5 rounded-md border-none bg-blue-500 text-white font-semibold cursor-pointer">Export</button>
                <button onClick={handleClearSignals} className="px-4 py-1.5 rounded-md border-none bg-pink-600 text-white font-semibold cursor-pointer">Clear</button>
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

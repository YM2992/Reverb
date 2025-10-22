"use client";

const SignalList = dynamic(() => import("./SignalList"), { ssr: false });
const SignalReplay = dynamic(() => import("./SignalReplay"), { ssr: false });

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { SignalStorage } from "./SignalStorage";
import { BluetoothManager, BluetoothState } from "./BluetoothManager";

import FooterBar from "./FooterBar";
import { Signal } from "./SignalList";
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
            <div className="relative mt-6 mb-4">
                <h1 className="flex flex-col items-center text-white select-none font-black text-4xl leading-tight tracking-wide">
                    <span>Reverb</span>
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
                <a
                    href="https://github.com/YM2992/Reverb"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View source on GitHub"
                    className="absolute right-0 top-1 flex items-center"
                    style={{ height: "2.2rem" }}
                >
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="hover:text-sky-400 transition-colors"
                        style={{ display: "inline-block", verticalAlign: "middle" }}
                    >
                        <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.274.098-2.656 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.025 2.747-1.025.546 1.382.202 2.402.1 2.656.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.481C19.138 20.183 22 16.437 22 12.021 22 6.484 17.523 2 12 2z" />
                    </svg>
                </a>
            </div>
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

    // Request geolocation access on first app load
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => { },
                () => { },
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
            );
        }
    }, []);

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

        // Immediately add signal without location
        const id = Math.random().toString(36).slice(2);
        const baseSignal: Signal = {
            id,
            frequency: Number(frequency),
            data: String(data),
            rssi: rssi,
            timestamp: Date.now(),
        };
        // Deduplicate by data+frequency: update if exists, else add
        setSignals(prevSignals => {
            const map = new Map<string, Signal>();
            for (const s of prevSignals) {
                map.set(`${s.data}_${s.frequency}`, s);
            }
            map.set(`${baseSignal.data}_${baseSignal.frequency}`, baseSignal);
            const deduped = Array.from(map.values());
            SignalStorage.saveSignals(deduped);
            return deduped;
        });
        setHistory(prevHistory => {
            const arr = [...prevHistory, baseSignal];
            SignalStorage.appendToHistory(baseSignal);
            return arr;
        });

        // Asynchronously update with location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setSignals(prevSignals => {
                        const map = new Map<string, Signal>();
                        for (const s of prevSignals) {
                            if (s.id === id) {
                                map.set(`${s.data}_${s.frequency}`, {
                                    ...s,
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude,
                                });
                            } else {
                                map.set(`${s.data}_${s.frequency}`, s);
                            }
                        }
                        const deduped = Array.from(map.values());
                        SignalStorage.saveSignals(deduped);
                        return deduped;
                    });
                    setHistory(prevHistory => {
                        // Update the matching signal in history
                        const arr = prevHistory.map(s =>
                            s.id === id
                                ? { ...s, latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                                : s
                        );
                        SignalStorage.appendToHistory({ ...baseSignal, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                        return arr;
                    });
                },
                () => { },
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
            );
        }
    }, [state.lastValueReceived]);

    // Handler for replaying signals
    const handleReplay = async (selectedSignals: Signal[]) => {
        if (!selectedSignals.length) return;
        // Replay each signal with a small delay (e.g., 300ms)
        for (const signal of selectedSignals) {
            // Send as TX,1,0,0,[data]
            await manager.writeStringCommandOnCharacteristic(
                `TX,1,0,0,${signal.data}`,
                setState
            );
            // Wait 300ms between signals
            await new Promise(res => setTimeout(res, 300));
        }
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
        <div className="relative">
            <DisconnectedBanner show={bleDisconnected} />
            {bleDisconnected && (
                <div className="h-14 w-full" aria-hidden="true"></div>
            )}
            <div
                className={
                    "mx-auto max-w-3xl w-full mb-20 px-4 transition-all"
                }
            >
                <BleWebAppUI
                    state={state}
                    onConnect={() => manager.connect(setState)}
                    onDisconnect={() => manager.disconnect(setState)}
                    onWrite={(val) => manager.writeOnCharacteristic(val, setState)}
                />
                <SignalList
                    signals={signals}
                    onRowClick={handleSignalRowClick}
                    onNicknameChange={(data, nickname) => {
                        // Update localStorage
                        const signalsArr = SignalStorage.loadSignals();
                        const updated = signalsArr.map((s: Signal) =>
                            s.data === data ? { ...s, nickname } : s
                        );
                        SignalStorage.saveSignals(updated);
                        // Update React state
                        setSignals(prevSignals =>
                            prevSignals.map(s =>
                                s.data === data ? { ...s, nickname } : s
                            )
                        );
                    }}
                />
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
        </div>
    );
};

export default BleWebApp;

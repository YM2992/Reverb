"use client";

import React, { useState } from "react";
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
            <h1>ESP32 Web BLE Application</h1>
            <p>
                BLE state: <strong><span style={{ color: state.bleStateColor }}>{state.bleState}</span></strong>
            </p>
            <h2>Fetched Value</h2>
            <p>{state.lastValueReceived}</p>
            <h2>Control GPIO 2</h2>
            <div style={{ marginBottom: 16 }}>
                <button style={buttonOn} onClick={() => onWrite(1)}>ON</button>
                <button style={buttonOff} onClick={() => onWrite(0)}>OFF</button>
            </div>
            <p>Last value sent: <span>{state.lastValueSent}</span></p>
        </div>
    );
}

export default function BleWebApp() {
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

    // Mock signals for demonstration; replace with real BLE/CC1101 data as needed
    const [signals, setSignals] = useState<Signal[]>([
        {
            id: '1',
            frequency: 433.92,
            data: '0xA1B2C3',
            rssi: -45,
            timestamp: Date.now() - 60000,
        },
        {
            id: '2',
            frequency: 868.3,
            data: '0xD4E5F6',
            rssi: -52,
            timestamp: Date.now() - 30000,
        },
    ]);

    // Handler for replaying signals (replace with real logic as needed)
    const handleReplay = (selectedSignals: Signal[]) => {
        alert(`Replaying ${selectedSignals.length} signal(s):\n` + selectedSignals.map(s => `${s.frequency} MHz, ${s.data}, RSSI: ${s.rssi}`).join('\n'));
    };

    return (
        <>
            <BleWebAppUI
                state={state}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
                onWrite={(val) => manager.writeOnCharacteristic(val, setState)}
            />
            <SignalList signals={signals} />
            <SignalReplay signals={signals} onReplay={handleReplay} />
            <FooterBar
                state={state}
                isConnected={state.bleState.includes("Connected")}
                deviceName={state.deviceName}
                lastMessageTimestamp={state.lastReceivedTimestamp}
                onConnect={() => manager.connect(setState)}
                onDisconnect={() => manager.disconnect(setState)}
            />
        </>
    );
}

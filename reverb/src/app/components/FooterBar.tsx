import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { BluetoothState } from './BluetoothManager';

interface FooterBarProps {
    state: BluetoothState;
    isConnected: boolean;
    deviceName?: string;
    lastMessageTimestamp?: number; // Unix timestamp in ms
    onConnect: () => void;
    onDisconnect: () => void;
}

const FooterBar: React.FC<FooterBarProps> = ({
    state,
    isConnected,
    deviceName,
    lastMessageTimestamp,
    onConnect,
    onDisconnect,
}) => {
    const [secondsAgo, setSecondsAgo] = useState<number>(0);

    useEffect(() => {
        if (!lastMessageTimestamp || !isConnected) {
            setSecondsAgo(0);
            return;
        }
        if (lastMessageTimestamp !== -1) {
            const update = () => {
                setSecondsAgo(Math.floor((Date.now() - lastMessageTimestamp) / 1000));
            };
            update();
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }
    }, [isConnected, lastMessageTimestamp]);

    return (
        <footer
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                background: '#222',
                color: '#fff',
                fontSize: '1rem',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', color: state.bleStateColor }}>
                <span>
                    <strong>
                        {isConnected
                            ? `Connected to ${deviceName ?? 'Unknown'}`
                            : (state.bleState.includes('Disconnected'))
                                ? 'Disconnected'
                                : (state.bleState.includes('Error connecting')) ? `${state.bleState} ${deviceName}` : `${state.bleState}`}
                    </strong>
                </span>
                <span style={{ color: '#fff', fontSize: '0.95em', marginTop: 2 }}>
                    {(isConnected && lastMessageTimestamp !== -1) ?
                        `Last message received ${secondsAgo}s ago`
                        : '-'}
                </span>
            </div>
            <button
                onClick={() => {
                    if (isConnected) {
                        if (window.confirm('Are you sure you want to disconnect?')) {
                            onDisconnect();
                        }
                    } else {
                        onConnect();
                    }
                }}
                aria-label={isConnected ? 'Disconnect' : 'Connect'}
                style={{
                    padding: '0.5rem 1.2rem',
                    background: isConnected ? '#e74c3c' : '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Image
                    src={isConnected ? "/disconnected.svg" : "/connected.svg"}
                    alt={isConnected ? "Disconnect" : "Connect"}
                    width={24}
                    height={24}
                    style={{ display: 'block', filter: 'invert(1)' }}
                />
            </button>
        </footer >
    );
};

export default FooterBar;
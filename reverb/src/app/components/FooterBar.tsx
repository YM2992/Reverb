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
            className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-3 bg-neutral-900 text-white text-base"
        >
            <div className="flex flex-col" style={{ color: state.bleStateColor }}>
                <span>
                    <strong>
                        {isConnected
                            ? `Connected to ${deviceName ?? 'Unknown'}`
                            : (state.bleState.includes('Disconnected'))
                                ? 'Disconnected'
                                : (state.bleState.includes('Error connecting')) ? `${state.bleState} ${deviceName}` : `${state.bleState}`}
                    </strong>
                </span>
                <span className="text-white text-sm mt-1">
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
                className={`px-5 py-2 rounded font-semibold flex items-center justify-center border-none ${isConnected ? 'bg-red-600' : 'bg-green-600'} text-white cursor-pointer`}
            >
                <Image
                    src={isConnected ? "/disconnected.svg" : "/connected.svg"}
                    alt={isConnected ? "Disconnect" : "Connect"}
                    width={24}
                    height={24}
                    className="block invert"
                />
            </button>
        </footer >
    );
};

export default FooterBar;
import React, { useEffect, useState } from 'react';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface TopbarProps {
    status: ConnectionStatus;
    pageTitle: string;
    lastMessageTimestamp?: number; // Unix timestamp in ms
    onConnect: () => void;
    onDisconnect: () => void;
}

const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
        case 'connected':
            return 'text-green-500';
        case 'connecting':
            return 'text-orange-400';
        default:
            return 'text-red-500';
    }
};

const ConnectionIcon: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    if (status === 'connected') {
        // 4 bars (full)
        return (
            <svg className={`w-5 h-5 mr-3 ${getStatusColor(status)}`} viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="14" width="2" height="4" rx="1" />
                <rect x="6" y="10" width="2" height="8" rx="1" />
                <rect x="10" y="6" width="2" height="12" rx="1" />
                <rect x="14" y="2" width="2" height="16" rx="1" />
            </svg>
        );
    }
    if (status === 'connecting') {
        // 2 bars (partial)
        return (
            <svg className={`w-5 h-5 mr-3 ${getStatusColor(status)}`} viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="14" width="2" height="4" rx="1" />
                <rect x="6" y="10" width="2" height="8" rx="1" />
                <rect x="10" y="6" width="2" height="12" rx="1" opacity="0.3" />
                <rect x="14" y="2" width="2" height="16" rx="1" opacity="0.1" />
            </svg>
        );
    }
    // Disconnected: show a "no connection" icon
    return (
        <svg className={`w-5 h-5 mr-3 ${getStatusColor(status)}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="8" stroke="currentColor" />
            <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" />
        </svg>
    );
};

const Topbar: React.FC<TopbarProps> = ({
    status,
    pageTitle,
    lastMessageTimestamp,
    onConnect,
    onDisconnect,
}) => {
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

    useEffect(() => {
        if (!lastMessageTimestamp) {
            setSecondsAgo(null);
            return;
        }
        const update = () => {
            setSecondsAgo(Math.floor((Date.now() - lastMessageTimestamp) / 1000));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastMessageTimestamp]);

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-zinc-900 text-white flex items-center px-6 z-50 shadow-md">
            <div className="flex items-center flex-1">
                <ConnectionIcon status={status} />
                <span className="font-semibold text-lg">{pageTitle}</span>
            </div>
            <div className="mr-6">
                {lastMessageTimestamp ? (
                    <span className="text-sm text-zinc-400">
                        Last message {secondsAgo}s ago
                    </span>
                ) : (
                    <span className="text-sm text-zinc-400">No messages yet</span>
                )}
            </div>
            <button
                onClick={status === 'connected' ? onDisconnect : onConnect}
                className={`${status === 'connected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : status === 'connecting'
                            ? 'bg-orange-400'
                            : 'bg-green-600 hover:bg-green-700'
                    } text-white border-none rounded px-4 py-2 font-semibold cursor-pointer transition-colors duration-150`}
                disabled={status === 'connecting'}
            >
                {status === 'connected'
                    ? 'Disconnect'
                    : status === 'connecting'
                        ? 'Connecting...'
                        : 'Connect'}
            </button>
        </header>
    );
};

export default Topbar;

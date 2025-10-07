"use client";
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';

const pageComponents: Record<string, React.ReactNode> = {
    home: <div><h1>Welcome to Reverb v2</h1><p>This is the entry point for the v2 app.</p></div>,
    transmit: <div><h1>Transmit</h1><p>Transmit page content here.</p></div>,
    replay: <div><h1>Replay</h1><p>Replay page content here.</p></div>,
    settings: <div><h1>Settings</h1><p>Settings page content here.</p></div>,
};

const V2Index: React.FC = () => {
    const [page, setPage] = useState<string>('home');

    return (
        <div>
            <Topbar
                status="disconnected"
                pageTitle={page}
                lastMessageTimestamp={Date.now()}
                onConnect={() => console.log('Connect')}
                onDisconnect={() => console.log('Disconnect')}
            />
            {pageComponents[page] || pageComponents['home']}
            <Navbar currentPage={page} onNavigate={setPage} />
        </div>
    );
};

export default V2Index;
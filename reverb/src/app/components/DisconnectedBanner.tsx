import React from "react";

interface DisconnectedBannerProps {
    show: boolean;
}

const DisconnectedBanner: React.FC<DisconnectedBannerProps> = ({ show }) => {
    if (!show) return null;
    return (
        <div
            style={{
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
            }}
        >
            BLE Disconnected. Please reconnect your device.
        </div>
    );
};

export default DisconnectedBanner;

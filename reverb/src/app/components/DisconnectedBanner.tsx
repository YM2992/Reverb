import React from "react";

interface DisconnectedBannerProps {
    show: boolean;
}

const DisconnectedBanner: React.FC<DisconnectedBannerProps> = ({ show }) => {
    if (!show) return null;
    return (
        <div
            className="fixed top-0 left-0 w-screen bg-[#d13a30] text-white font-bold text-lg text-center py-3 z-[2000] shadow-lg tracking-wide"
        >
            BLE Disconnected. Please reconnect your device.
        </div>
    );
};

export default DisconnectedBanner;

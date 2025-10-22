import React, { useState } from "react";
import { Signal } from "./SignalList";

interface SignalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: Signal[];
    onClear: () => void;
}

const SignalHistoryModal: React.FC<SignalHistoryModalProps> = ({ isOpen, onClose, history, onClear }) => {

    if (!isOpen) return null;
    return (
        <div
            className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-70 z-[1000] flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-neutral-900 text-white mx-auto p-6 rounded-xl max-w-3xl min-h-[300px] relative shadow-2xl w-full"
                style={{ marginTop: '10vh', marginBottom: '10vh' }}
                onClick={e => e.stopPropagation()}
            >
                <h2 className="mt-0 text-white text-xl font-bold">Signal History</h2>
                <button onClick={onClose} className="absolute top-3 right-3 bg-neutral-900 text-white border border-gray-600 rounded-md px-4 py-1.5 font-semibold cursor-pointer">Close</button>
                <button onClick={onClear} className="absolute top-3 right-32 bg-pink-600 text-white border-none rounded-md px-4 py-1.5 font-semibold cursor-pointer">Clear History</button>
                <div className="max-h-[400px] overflow-y-auto mt-8">
                    <table className="w-full border-collapse bg-transparent text-white font-mono text-sm">
                        <thead>
                            <tr>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Nickname</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Time</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Frequency (MHz)</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Data</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">RSSI</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Latitude</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2">Longitude</th>
                                <th className="border-b border-gray-700 text-white px-2 py-2 text-center">Map</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-gray-400 py-4">No history</td></tr>
                            ) : (
                                history.slice().reverse().map((signal, idx) => (
                                    <tr key={idx}>
                                        <td className="px-2 py-2 border-b border-gray-800">
                                            {signal.nickname ?? "-"}
                                        </td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.timestamp ? new Date(signal.timestamp).toLocaleString() : "-"}</td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.frequency ?? "-"}</td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.data}</td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.rssi ?? "-"}</td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.latitude !== undefined ? signal.latitude.toFixed(6) : (Date.now() - signal.timestamp < 10000 ? '⏳' : '-')}</td>
                                        <td className="px-2 py-2 border-b border-gray-800">{signal.longitude !== undefined ? signal.longitude.toFixed(6) : (Date.now() - signal.timestamp < 10000 ? '⏳' : '-')}</td>
                                        <td className="px-2 py-2 border-b border-gray-800 text-center">
                                            {(signal.latitude !== undefined && signal.longitude !== undefined) ? (
                                                <a
                                                    href={`https://maps.google.com/?q=${signal.latitude},${signal.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View on map"
                                                    style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}
                                                    onClick={e => { e.stopPropagation(); }}
                                                >
                                                    Map
                                                </a>
                                            ) : (
                                                <span style={{ color: "#888" }}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SignalHistoryModal;

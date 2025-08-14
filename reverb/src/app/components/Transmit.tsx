import React, { useState, useRef } from "react";

interface TransmitProps {
    onTransmit: (value: string) => void;
    onStart: (value: string, timeout: string, repeat: string) => void;
    onStop: () => void;
    value?: string;
    setValue?: (v: string) => void;
    bleConnected?: boolean;
}

const Transmit: React.FC<TransmitProps> = ({ onTransmit, onStart, onStop, value: propValue, setValue: propSetValue, bleConnected = true }) => {
    const [internalValue, setInternalValue] = useState("");
    const value = propValue !== undefined ? propValue : internalValue;
    const setValue = propSetValue !== undefined ? propSetValue : setInternalValue;
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [timeout, setTimeoutValue] = useState("5000");
    const [repeat, setRepeat] = useState("100");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTransmit = () => {
        if (value.trim() !== "" && bleConnected) {
            onTransmit(value);
        }
    };

    const handleClear = () => {
        setValue("");
    };

    const handleStartStop = () => {
        if (isTransmitting) {
            setIsTransmitting(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            onStop();
        } else if (bleConnected && value.trim() !== "") {
            setIsTransmitting(true);
            onStart(value, timeout, repeat);
            // Set a timer to auto-stop after timeout ms
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            const t = parseInt(timeout, 10);
            if (!isNaN(t) && t > 0) {
                timeoutTimerRef.current = setTimeout(() => {
                    setIsTransmitting(false);
                    onStop();
                }, t);
            }
        }
    };

    // Stop transmitting if BLE disconnects
    React.useEffect(() => {
        if (!bleConnected && isTransmitting) {
            setIsTransmitting(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            onStop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bleConnected]);

    // Clean up timer on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        };
    }, []);

    return (
        <div className="mx-auto w-full max-w-2xl my-3">
            {/* Value row */}
            <div className="flex gap-4 items-end mb-2">
                <div className="flex-1 min-w-0 flex flex-col">
                    <label htmlFor="transmit-value" className="font-medium mb-1">Value</label>
                    <input
                        id="transmit-value"
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="Value"
                        className="px-3 py-2 rounded-md border border-gray-300 text-base"
                    />
                </div>
            </div>
            {/* Timeout and Repeat row */}
            <div className="flex gap-4 items-end mb-2">
                <div className="flex-1 min-w-0 flex flex-col">
                    <label htmlFor="transmit-timeout" className="font-medium mb-1">Timeout (ms)</label>
                    <input
                        id="transmit-timeout"
                        type="number"
                        value={timeout}
                        onChange={e => setTimeoutValue(e.target.value)}
                        placeholder="Timeout (ms)"
                        min={1}
                        max={60000}
                        className="px-3 py-2 rounded-md border border-gray-300 text-base"
                    />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                    <label htmlFor="transmit-repeat" className="font-medium mb-1">Repeat (ms)</label>
                    <input
                        id="transmit-repeat"
                        type="number"
                        value={repeat}
                        onChange={e => setRepeat(e.target.value)}
                        placeholder="Repeat (ms)"
                        min={1}
                        max={10000}
                        className="px-3 py-2 rounded-md border border-gray-300 text-base"
                    />
                </div>
            </div>
            {/* Buttons row */}
            <div className="flex gap-3 mt-2 flex-wrap">
                <button
                    onClick={handleTransmit}
                    disabled={value.trim() === "" || !bleConnected}
                    className={`flex-1 min-w-0 py-2 rounded-md border-none text-white font-semibold text-base ${value.trim() === "" || !bleConnected ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-500 to-cyan-400 cursor-pointer'}`}
                >
                    Transmit Once
                </button>
                <button
                    onClick={handleClear}
                    disabled={value.trim() === "" || !bleConnected}
                    className={`flex-none min-w-0 py-2 rounded-md border-none text-white font-semibold text-base ${value.trim() === "" || !bleConnected ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gray-600 cursor-pointer'}`}
                >
                    Clear
                </button>
                <button
                    onClick={handleStartStop}
                    disabled={(!isTransmitting && (value.trim() === "" || !bleConnected))}
                    className={`flex-none min-w-0 py-2 rounded-md border-none text-white font-semibold text-base ${isTransmitting ? 'bg-gradient-to-r from-pink-600 to-orange-400 cursor-pointer' : (value.trim() === "" || !bleConnected) ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-green-600 cursor-pointer'}`}
                >
                    {isTransmitting ? "Stop Transmitting" : "Start Transmitting"}
                </button>
            </div>
        </div>
    );
};

export default Transmit;

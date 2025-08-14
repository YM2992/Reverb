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
        <div style={{ width: "100%", maxWidth: 600, margin: "12px 0" }}>
            {/* Value row */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <label htmlFor="transmit-value" style={{ fontWeight: 500, marginBottom: 4 }}>Value</label>
                    <input
                        id="transmit-value"
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="Value"
                        style={{
                            padding: "10px 12px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: "1rem",
                        }}
                    />
                </div>
            </div>
            {/* Timeout and Repeat row */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <label htmlFor="transmit-timeout" style={{ fontWeight: 500, marginBottom: 4 }}>Timeout (ms)</label>
                    <input
                        id="transmit-timeout"
                        type="number"
                        value={timeout}
                        onChange={e => setTimeoutValue(e.target.value)}
                        placeholder="Timeout (ms)"
                        min={1}
                        max={60000}
                        style={{
                            padding: "10px 12px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: "1rem",
                        }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <label htmlFor="transmit-repeat" style={{ fontWeight: 500, marginBottom: 4 }}>Repeat (ms)</label>
                    <input
                        id="transmit-repeat"
                        type="number"
                        value={repeat}
                        onChange={e => setRepeat(e.target.value)}
                        placeholder="Repeat (ms)"
                        min={1}
                        max={10000}
                        style={{
                            padding: "10px 12px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            fontSize: "1rem",
                        }}
                    />
                </div>
            </div>
            {/* Buttons row */}
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <button
                    onClick={handleTransmit}
                    disabled={value.trim() === "" || !bleConnected}
                    style={{
                        flex: "1 1 55px",
                        minWidth: 0,
                        padding: "10px 0",
                        borderRadius: 6,
                        border: "none",
                        background: (value.trim() === "" || !bleConnected) ? "#b0b0b0" : "linear-gradient(90deg, #007cf0 0%, #00dfd8 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1rem",
                        opacity: value.trim() === "" ? 0.7 : 1,
                        cursor: value.trim() === "" ? "not-allowed" : "pointer",
                    }}
                >
                    Transmit Once
                </button>
                <button
                    onClick={handleClear}
                    disabled={value.trim() === "" || !bleConnected}
                    style={{
                        flex: "0 1 55px",
                        minWidth: 0,
                        padding: "10px 0",
                        borderRadius: 6,
                        border: "none",
                        background: (value.trim() === "" || !bleConnected) ? "#b0b0b0" : "#888",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1rem",
                        opacity: value.trim() === "" ? 0.7 : 1,
                        cursor: value.trim() === "" ? "not-allowed" : "pointer",
                    }}
                >
                    Clear
                </button>
                <button
                    onClick={handleStartStop}
                    disabled={(!isTransmitting && (value.trim() === "" || !bleConnected))}
                    style={{
                        flex: "0 1 150px",
                        minWidth: 0,
                        padding: "10px 0",
                        borderRadius: 6,
                        border: "none",
                        background: isTransmitting
                            ? "linear-gradient(90deg, #f0004c 0%, #ff7a18 100%)"
                            : (value.trim() === "" || !bleConnected) ? "#b0b0b0" : "linear-gradient(90deg, #24af37 0%, #24af37 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "1rem",
                        opacity: !isTransmitting && value.trim() === "" ? 0.7 : 1,
                        cursor: !isTransmitting && value.trim() === "" ? "not-allowed" : "pointer",
                    }}
                >
                    {isTransmitting ? "Stop Transmitting" : "Start Transmitting"}
                </button>
            </div>
        </div>
    );
};

export default Transmit;

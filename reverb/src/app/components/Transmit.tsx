import React, { useState, useRef } from "react";

interface TransmitProps {
    onTransmit: (value: string) => void;
    onStart: (value: string) => void;
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
            onStop();
        } else if (bleConnected && value.trim() !== "") {
            setIsTransmitting(true);
            onStart(value);
            intervalRef.current = setInterval(() => {
                onTransmit(value);
            }, 1000);
        }
    };

    // Stop transmitting if BLE disconnects
    React.useEffect(() => {
        if (!bleConnected && isTransmitting) {
            setIsTransmitting(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            onStop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bleConnected]);

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                margin: "12px 0",
                width: "100%",
                maxWidth: 600,
            }}
        >
            <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Value"
                style={{
                    flex: "1 1 230px",
                    minWidth: 0,
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                }}
            />
            <button
                onClick={handleTransmit}
                disabled={value.trim() === "" || !bleConnected}
                style={{
                    flex: "1 1 110px",
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
                    flex: "0 1 160px",
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
    );
};

export default Transmit;

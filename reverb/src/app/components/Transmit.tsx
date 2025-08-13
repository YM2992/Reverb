import React, { useState, useRef } from "react";

interface TransmitProps {
    onTransmit: (value: string) => void;
    onStart: (value: string) => void;
    onStop: () => void;
    value?: string;
    setValue?: (v: string) => void;
}

const Transmit: React.FC<TransmitProps> = ({ onTransmit, onStart, onStop, value: propValue, setValue: propSetValue }) => {
    const [internalValue, setInternalValue] = useState("");
    const value = propValue !== undefined ? propValue : internalValue;
    const setValue = propSetValue !== undefined ? propSetValue : setInternalValue;
    const [isTransmitting, setIsTransmitting] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleTransmit = () => {
        if (value.trim() !== "") {
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
        } else {
            setIsTransmitting(true);
            onStart(value);
            intervalRef.current = setInterval(() => {
                onTransmit(value);
            }, 1000);
        }
    };

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
                style={{
                    flex: "1 1 110px",
                    minWidth: 0,
                    padding: "10px 0",
                    borderRadius: 6,
                    border: "none",
                    background: "linear-gradient(90deg, #007cf0 0%, #00dfd8 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "1rem",
                }}
            >
                Transmit Once
            </button>
            <button
                onClick={handleClear}
                style={{
                    flex: "0 1 55px",
                    minWidth: 0,
                    padding: "10px 0",
                    borderRadius: 6,
                    border: "none",
                    background: "#888",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "1rem",
                }}
            >
                Clear
            </button>
            <button
                onClick={handleStartStop}
                style={{
                    flex: "0 1 160px",
                    minWidth: 0,
                    padding: "10px 0",
                    borderRadius: 6,
                    border: "none",
                    background: isTransmitting
                        ? "linear-gradient(90deg, #f0004c 0%, #ff7a18 100%)"
                        : "linear-gradient(90deg, #24af37 0%, #24af37 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "1rem",
                }}
            >
                {isTransmitting ? "Stop Transmitting" : "Start Transmitting"}
            </button>
        </div>
    );
};

export default Transmit;

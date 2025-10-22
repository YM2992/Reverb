

import { Signal } from "./SignalList";

const STORAGE_KEY = "reverb_signals";

export class SignalStorage {
    private static HISTORY_KEY = "reverb_signals_history";

    static appendToHistory(signal: Signal): void {
        try {
            const data = localStorage.getItem(SignalStorage.HISTORY_KEY);
            let arr: Signal[] = [];
            if (data) {
                arr = JSON.parse(data);
                if (!Array.isArray(arr)) arr = [];
            }
            arr.push(signal);
            localStorage.setItem(SignalStorage.HISTORY_KEY, JSON.stringify(arr));
    } catch {}
    }

    static loadHistory(): Signal[] {
        try {
            const data = localStorage.getItem(SignalStorage.HISTORY_KEY);
            if (!data) return [];
            const arr = JSON.parse(data);
            if (Array.isArray(arr)) return arr;
            return [];
    } catch { return []; }
    }

    static clearHistory(): void {
    try { localStorage.removeItem(SignalStorage.HISTORY_KEY); } catch {}
    }
    static saveSignals(signals: Signal[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
        } catch {
            // Handle quota or serialization errors
        }
    }

    static saveHistory(history: Signal[]): void {
        try {
            localStorage.setItem(SignalStorage.HISTORY_KEY, JSON.stringify(history));
        } catch {
            // Handle quota or serialization errors
        }
    }

    static loadSignals(): Signal[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                // Optionally validate structure
                return parsed;
            }
            return [];
    } catch {
            return [];
        }
    }

    static clearSignals(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
    } catch { }
    }
}

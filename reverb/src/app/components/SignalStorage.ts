import { Signal } from "./SignalList";

const STORAGE_KEY = "reverb_signals";

export class SignalStorage {
    static saveSignals(signals: Signal[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
        } catch (e) {
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
        } catch (e) {
            return [];
        }
    }

    static clearSignals(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { }
    }
}

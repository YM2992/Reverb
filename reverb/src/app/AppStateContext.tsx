'use client';
import React, { createContext, useContext, useState } from 'react';

// Define your global state shape here
type AppState = {
    isConnected: boolean;
    signalHistory: unknown[];
};

type AppStateContextType = {
    state: AppState;
    setConnected: (isConnected: boolean) => void;
    addSignal: (signal: unknown) => void;
};

const initialState: AppState = {
    isConnected: false,
    signalHistory: [],
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

type AppStateProviderProps = {
    children: React.ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
    const [state, setState] = useState<AppState>(initialState);

    // Example actions
    const setConnected = (isConnected: boolean) => setState((s) => ({ ...s, isConnected }));
    const addSignal = (signal: unknown) => setState((s) => ({ ...s, signalHistory: [...s.signalHistory, signal] }));

    return (
        <AppStateContext.Provider value={{ state, setConnected, addSignal }}>
            {children}
        </AppStateContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppStateContext);
    if (!context) throw new Error('useAppState must be used within AppStateProvider');
    return context;
}

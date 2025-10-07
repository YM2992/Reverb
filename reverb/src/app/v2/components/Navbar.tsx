'use client';

import React from 'react';


const navItems = [
    {
        label: 'Home',
        page: 'home',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12L12 3l9 9" />
                <path d="M9 21V12h6v9" />
                <path d="M21 21H3" />
            </svg>
        ),
    },
    {
        label: 'Transmit',
        page: 'transmit',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
    },
    {
        label: 'Replay',
        page: 'replay',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
        ),
    },
    {
        label: 'Settings',
        page: 'settings',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 11 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

type NavbarProps = {
    currentPage: string;
    onNavigate: (page: string) => void;
};

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
    return (
        <nav
            className="
                fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50
                dark:bg-gray-900 dark:border-gray-700
                flex
                shadow-[0_-2px_16px_0_rgba(0,0,0,0.08)]
                md:hidden
            "
            style={{
                borderRadius: '20px 20px 0 0',
                boxShadow: '0 -4px 24px 0 rgba(0,0,0,0.10)',
            }}
        >
            <ul
                className="
                    flex justify-around items-center m-0 p-2 list-none w-full
                "
            >
                {navItems.map((item) => {
                    const isActive = currentPage === item.page;
                    return (
                        <li key={item.label} className="flex-1 text-center">
                            <button
                                type="button"
                                onClick={() => onNavigate(item.page)}
                                className={`
                                    flex flex-col items-center justify-center
                                    text-base no-underline
                                    transition-colors
                                    ${isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-800 dark:text-gray-100'}
                                    relative
                                `}
                                style={{
                                    fontWeight: isActive ? 600 : 400,
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    padding: 0,
                                    cursor: 'pointer',
                                }}
                            >
                                <span
                                    className={`
                                        text-2xl
                                        transition-transform duration-200
                                        ${isActive ? 'scale-110' : ''}
                                    `}
                                >
                                    {item.icon}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Navbar;

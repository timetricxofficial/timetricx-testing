'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success' | 'warning';
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
}: DialogProps) {

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const icons = {
        info: <Info className="w-8 h-8 text-blue-500" />,
        error: <X className="w-8 h-8 text-red-500" />,
        success: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        warning: <AlertTriangle className="w-8 h-8 text-amber-500" />,
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="p-8 text-center flex flex-col items-center">
                            <div className="mb-4">
                                {icons[type]}
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                {message}
                            </p>
                        </div>

                        <div className="flex border-t border-zinc-100 dark:border-zinc-800">
                            {onConfirm ? (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        {cancelLabel}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`flex-1 px-6 py-4 text-sm font-semibold text-white transition-colors
                      ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                    `}
                                    >
                                        {confirmLabel}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

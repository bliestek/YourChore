"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PinModalProps {
  childName: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

export default function PinModal({ childName, onSubmit, onCancel, error }: PinModalProps) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length === 4) {
      onSubmit(pin);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
        >
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-display font-bold text-lg text-gray-800">
              Enter {childName}&apos;s PIN
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="----"
              className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-3 px-4 bg-gray-100 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none"
            />

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Go!
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

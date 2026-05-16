import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Lock } from 'lucide-react';

export default function PinLock() {
  const { setPinUnlocked, T } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();
  const storedPin = localStorage.getItem('wave_pin') || '';

  useEffect(() => { inputRef.current?.focus(); }, []);

  function tryUnlock(value) {
    if (value === storedPin) {
      setPinUnlocked(true);
      sessionStorage.setItem('wave_pin_unlocked', '1');
    } else {
      setError(T('wrongPin'));
      setTimeout(() => setError(''), 1200);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-[#0B0C10]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">{T('locked_title')}</h1>
        <p className="text-sm text-zinc-500 mb-6">{T('enterPin')}</p>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g,'').slice(0,4);
            setPin(v);
            if (v.length === 4) tryUnlock(v);
          }}
          className="text-center text-3xl tracking-[1em] w-56 h-16 rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          data-testid="pin-input"
        />
        {error && <p className="text-rose-500 mt-3 text-sm" data-testid="pin-error">{error}</p>}
        <Button onClick={() => tryUnlock(pin)} className="mt-6 rounded-xl" data-testid="pin-unlock-btn">{T('unlock')}</Button>
      </motion.div>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { MessageCircleHeart } from 'lucide-react';

export default function Maintenance() {
  const { siteSettings } = useApp();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-[#0B0C10] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 start-1/4 w-[420px] h-[420px] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-1/3 end-1/4 w-[420px] h-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-lg px-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white mb-6">
          <MessageCircleHeart size={28} />
        </div>
        <h1 className="text-4xl sm:text-5xl tracking-tight leading-none font-bold mb-4" data-testid="maintenance-title">
          {siteSettings.site_name || 'WaveChat'}
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 mb-3">الموقع متوقف مؤقتاً للصيانة</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400" data-testid="maintenance-message">
          {siteSettings.maintenance_message || 'سنعود قريباً، شكراً لصبركم.'}
        </p>
      </motion.div>
    </div>
  );
}

import React from 'react';
import { useSite } from '../context/SiteContext';

const Footer = () => {
  const { settings } = useSite();
  return (
    <footer className="relative mt-16 border-t border-emerald-500/10 bg-black">
      <div className="max-w-6xl mx-auto px-5 py-8 text-center">
        <p className="text-gray-400 text-sm">{settings?.site_name} — جميع الحقوق محفوظة {new Date().getFullYear()} ©</p>
      </div>
    </footer>
  );
};
export default Footer;

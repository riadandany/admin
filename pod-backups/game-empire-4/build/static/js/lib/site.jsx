import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const SiteCtx = createContext(null);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({ site_name: "Mr Games", maintenance_mode: false });
  const [lang, setLang] = useState(localStorage.getItem("lang") || "ar");

  useEffect(() => {
    api.get("/site/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const refreshSettings = async () => {
    const r = await api.get("/site/settings");
    setSettings(r.data);
  };

  return (
    <SiteCtx.Provider value={{ settings, refreshSettings, lang, setLang }}>
      {children}
    </SiteCtx.Provider>
  );
}

export const useSite = () => useContext(SiteCtx);

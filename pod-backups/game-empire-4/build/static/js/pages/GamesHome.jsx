import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { Heart, Share2, Lock, Play } from "lucide-react";
import { useSite } from "../lib/site";
import { useT } from "../i18n";

export default function GamesHome() {
  const [games, setGames] = useState([]);
  const [ads, setAds] = useState([]);
  const [popupAd, setPopupAd] = useState(null);
  const { lang, settings } = useSite();
  const t = useT(lang);

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data)).catch(() => {});
    api.get("/ads/active").then((r) => {
      const list = r.data || [];
      setAds(list.filter((a) => a.placement === "banner"));
      const popup = list.find((a) => a.placement === "popup");
      if (popup) setPopupAd(popup);
    }).catch(() => {});
  }, []);

  const toggleFav = async (g) => {
    const r = await api.post(`/games/${g.id}/favorite`);
    setGames(games.map((x) => (x.id === g.id ? { ...x, is_favorite: r.data.favorited } : x)));
  };

  const share = async (g) => {
    const url = `${window.location.origin}/games/${g.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: g.title, url });
      else { await navigator.clipboard.writeText(url); alert("تم نسخ الرابط"); }
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
      {ads.map((a) => (
        <div key={a.id} className="mb-4 p-4 rounded-xl text-mono text-sm flex items-center justify-between" style={{ background: a.bg_color, color: a.text_color }} data-testid={`ad-banner-${a.id}`}>
          <div><b>{a.title}</b> {a.description && <span className="ms-2 opacity-80">— {a.description}</span>}</div>
        </div>
      ))}

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-display text-4xl sm:text-5xl font-black tracking-tight neon-text">{t("games")}</h1>
          <div className="text-mono text-xs text-[var(--text-muted)] mt-2">// {games.length} GAMES AVAILABLE</div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="glass p-10 text-center">
          <div className="text-display text-2xl mb-2">لا توجد ألعاب بعد</div>
          <div className="text-mono text-sm text-[var(--text-muted)]">أضف ألعاباً من لوحة المطور /admin-dev</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" data-testid="games-grid">
          {games.map((g) => (
            <div key={g.id} className="glass card-hover overflow-hidden relative" data-testid={`game-card-${g.slug}`}>
              <Link to={`/games/${g.slug}`} className="block">
                <div className="aspect-video bg-gradient-to-br from-[#0a0c10] to-[#1a1d24] relative overflow-hidden">
                  {g.image_url ? <img src={g.image_url} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full grid place-items-center text-display text-4xl text-[var(--accent)] opacity-50">{g.title?.[0]}</div>
                  )}
                  {g.premium_only && (
                    <div className="absolute top-2 start-2 px-2 py-1 rounded-md text-mono text-[10px] bg-black/60 backdrop-blur flex items-center gap-1 border border-[var(--premium-gold)]/40 text-[var(--premium-gold)]">
                      <Lock size={10} /> PREMIUM
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-display font-bold truncate">{g.title}</div>
                  <div className="text-mono text-[10px] text-[var(--text-muted)] mt-1">{g.plays_count || 0} plays</div>
                </div>
              </Link>
              <div className="absolute top-2 end-2 flex gap-1">
                <button onClick={() => toggleFav(g)} className="btn-ghost p-1.5" data-testid={`fav-${g.slug}`} title={t("favorites")}>
                  <Heart size={14} fill={g.is_favorite ? "var(--accent)" : "none"} color={g.is_favorite ? "var(--accent)" : "currentColor"} />
                </button>
                <button onClick={() => share(g)} className="btn-ghost p-1.5" data-testid={`share-${g.slug}`} title={t("share")}>
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {popupAd && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setPopupAd(null)}>
          <div className="glass-strong p-6 max-w-md text-center" style={{ borderColor: popupAd.bg_color }} onClick={(e) => e.stopPropagation()}>
            <div className="text-display text-2xl font-bold mb-2" style={{ color: popupAd.bg_color }}>{popupAd.title}</div>
            <div className="text-sm text-[var(--text-secondary)] mb-4">{popupAd.description}</div>
            <button className="btn-accent" onClick={() => setPopupAd(null)} data-testid="close-popup-ad">حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
}

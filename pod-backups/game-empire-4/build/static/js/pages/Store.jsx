import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Store() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState([]);
  const load = () => api.get("/store/products").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const buy = async (id) => {
    try { await api.post(`/store/buy/${id}`); await refresh(); load(); alert("تم الشراء"); }
    catch (e) { alert(e?.response?.data?.detail); }
  };
  const kinds = ["name_color", "name_decoration", "profile_frame", "profile_effect", "premium_games", "premium_cosmetic"];
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-display text-4xl font-black neon-text">المتجر</h1>
        <div className="text-mono text-sm text-[var(--text-muted)]">رصيدك: <b className="text-[var(--accent)]">{user?.points}</b> pts</div>
      </div>
      {kinds.map((k) => {
        const list = items.filter((i) => i.kind === k);
        if (list.length === 0) return null;
        return (
          <section key={k} className="mb-6">
            <h2 className="text-display text-xl mb-2">{({ name_color: "ألوان الأسماء", name_decoration: "زخارف الأسماء", profile_frame: "إطارات الصور", profile_effect: "تأثيرات البروفايل", premium_games: "حساب فاخر — الألعاب", premium_cosmetic: "حساب فاخر — المظاهر" }[k])}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {list.map((it) => (
                <div key={it.id} className={`glass p-4 card-hover relative ${it.owned ? "opacity-60" : ""}`} data-testid={`product-${it.id}`}>
                  <div className="text-display font-bold mb-1">{it.name}</div>
                  <div className="text-mono text-xs text-[var(--text-muted)] mb-2">{it.description}</div>
                  {k === "name_color" && it.value && <div className="name-premium text-lg mb-2" style={{ "--name-color": it.value }}>Sample</div>}
                  {k === "name_decoration" && <div className={`mb-2 deco-${it.value}`}>Name</div>}
                  {k === "profile_frame" && <div className={`frame-${it.value} mb-2`} style={{ width: 48, height: 48, borderRadius: 9999, background: "#1a1d24" }} />}
                  <div className="flex items-center justify-between"><span className="text-mono">{it.price} pts</span>{it.owned ? <span className="text-xs text-[var(--text-muted)]">نفذت الكمية</span> : <button onClick={() => buy(it.id)} className="btn-accent text-xs" data-testid={`buy-${it.id}`}>شراء</button>}</div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {items.length === 0 && <div className="glass p-10 text-center text-mono text-sm text-[var(--text-muted)]">المتجر فارغ — أضف منتجات من لوحة المطور</div>}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import api from "../lib/api";
import { BuiltinGame } from "../components/BuiltinGames";

export default function GamePlayer() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [g, setG] = useState(null);
  const [err, setErr] = useState("");
  const start = useRef(Date.now());

  useEffect(() => {
    api.get(`/games/${slug}`).then((r) => setG(r.data)).catch((e) => setErr(e?.response?.data?.detail || "خطأ"));
  }, [slug]);

  useEffect(() => {
    return () => {
      if (g?.id) {
        const seconds = Math.floor((Date.now() - start.current) / 1000);
        if (seconds > 5) api.post(`/games/${g.id}/play`, { seconds }).catch(() => {});
      }
    };
  }, [g]);

  const exit = () => nav("/");

  if (err) return <div className="p-10 text-center" data-testid="game-error">{err}</div>;
  if (!g) return <div className="p-10 text-center text-mono">جار التحميل...</div>;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-30" data-testid="game-player">
      <div className="flex items-center justify-between p-3 glass-strong border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={exit} className="btn-ghost p-2" data-testid="exit-game"><ArrowLeft size={18} /></button>
          <div className="text-display font-bold">{g.title}</div>
        </div>
        <button onClick={exit} className="btn-danger flex items-center gap-1" data-testid="exit-game-btn"><X size={14} /> خروج</button>
      </div>
      <div className="flex-1 relative bg-black">
        {g.game_type === "builtin" ? (
          <BuiltinGame gameKey={g.builtin_key} />
        ) : g.game_url ? (
          <iframe src={g.game_url} title={g.title} className="w-full h-full" allow="fullscreen" />
        ) : (
          <div className="grid place-items-center h-full text-mono">لا يوجد محتوى للعبة</div>
        )}
      </div>
    </div>
  );
}

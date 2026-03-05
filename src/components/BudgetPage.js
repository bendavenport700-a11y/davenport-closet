'use client'
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const sb = (path) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" } });

export default function BudgetPage() {
  const [wardrobes, setWardrobes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("summary"); // "summary" | "detailed"

  const loadAll = useCallback(async () => {
    try {
      const [wR, iR] = await Promise.all([
        sb("wardrobes?order=created_at").then(r => r.json()),
        sb("items?order=created_at").then(r => r.json()),
      ]);
      setWardrobes(Array.isArray(wR) ? wR : []);
      setItems(Array.isArray(iR) ? iR : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const wItems = (id) => items.filter(i => i.wardrobe_id === id);
  const wSpend = (id) => wItems(id).reduce((s, i) => s + Number(i.price || 0), 0);
  const totalBudget = wardrobes.reduce((s, w) => s + Number(w.budget || 0), 0);
  const totalSpend = items.reduce((s, i) => s + Number(i.price || 0), 0);
  const totalRemaining = totalBudget - totalSpend;
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpend / totalBudget) * 100)) : 0;

  const typeBreakdown = () => {
    const map = {};
    items.forEach(i => { map[i.type] = (map[i.type] || 0) + Number(i.price || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  if (loading) return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#c9a84c", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#e8e4dc", fontFamily: "Georgia, 'Times New Roman', serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a20", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, background: "#0a0a0c", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/" style={{ letterSpacing: "0.28em", fontSize: 12, color: "#c9a84c", textTransform: "uppercase", textDecoration: "none" }}>Davenport</Link>
          <span style={{ width: 1, height: 16, background: "#222" }} />
          <span style={{ letterSpacing: "0.15em", fontSize: 10, color: "#3a3a3a", textTransform: "uppercase" }}>Budget Overview</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["summary", "detailed"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "5px 14px", borderRadius: 3, border: `1px solid ${view === v ? "#c9a84c" : "#1e1e24"}`, background: view === v ? "#c9a84c15" : "none", color: view === v ? "#c9a84c" : "#555", cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {v === "summary" ? "Summary" : "Full Breakdown"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px" }}>

        {/* Top-line numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden", marginBottom: 40 }}>
          {[
            { label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, sub: `across ${wardrobes.length} collections`, color: "#e8e4dc" },
            { label: "Total Spent", value: `$${totalSpend.toLocaleString()}`, sub: `${items.length} pieces`, color: "#c9a84c" },
            { label: "Remaining", value: `$${Math.abs(totalRemaining).toLocaleString()}`, sub: totalRemaining < 0 ? "over budget" : "available", color: totalRemaining < 0 ? "#c87878" : "#8fbc8f" },
            { label: "Budget Used", value: `${overallPct}%`, sub: "overall", color: overallPct > 90 ? "#c87878" : "#e8e4dc" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "22px 24px", background: "#0d0d10", borderRight: i < 3 ? "1px solid #1a1a20" : "none" }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 26, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#3a3a3a" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Overall Budget Usage</div>
            <div style={{ fontSize: 10, color: "#555" }}>${totalSpend.toLocaleString()} / ${totalBudget.toLocaleString()}</div>
          </div>
          <div style={{ height: 6, background: "#181820", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overallPct}%`, background: overallPct > 90 ? "#c87878" : "#c9a84c", borderRadius: 3, transition: "width 0.6s" }} />
          </div>
        </div>

        {/* SUMMARY VIEW */}
        {view === "summary" && (
          <div>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 20 }}>Collection Summary</div>

            {/* Collection rows */}
            <div style={{ border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden", marginBottom: 40 }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 120px 80px", gap: 0, background: "#0a0a0c", padding: "10px 20px", borderBottom: "1px solid #1a1a20" }}>
                {["Collection", "Budget", "Spent", "Remaining", "Progress", "Pieces"].map(h => (
                  <div key={h} style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: "0.14em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {wardrobes.map((w, idx) => {
                const spend = wSpend(w.id);
                const rem = w.budget - spend;
                const pct = w.budget > 0 ? Math.min(100, Math.round((spend / w.budget) * 100)) : 0;
                const count = wItems(w.id).length;
                return (
                  <div key={w.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 120px 80px", gap: 0, padding: "14px 20px", background: "#0d0d10", borderBottom: idx < wardrobes.length - 1 ? "1px solid #1a1a20" : "none", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111116"} onMouseLeave={e => e.currentTarget.style.background = "#0d0d10"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: w.accent, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, color: "#e8e4dc" }}>{w.name}</div>
                        {w.description && <div style={{ fontSize: 10, color: "#333", marginTop: 2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.description}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#555" }}>${Number(w.budget || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: w.accent }}>${spend.toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: rem < 0 ? "#c87878" : "#8fbc8f" }}>{rem < 0 ? "-" : ""}${Math.abs(rem).toLocaleString()}</div>
                    <div>
                      <div style={{ height: 4, background: "#181820", borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct > 90 ? "#c87878" : w.accent }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#333" }}>{pct}%</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#555" }}>{count}</div>
                  </div>
                );
              })}
              {/* Totals row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 120px 80px", gap: 0, padding: "14px 20px", background: "#111116", borderTop: "1px solid #2a2a2a", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</div>
                <div style={{ fontSize: 13, color: "#e8e4dc", fontWeight: 700 }}>${totalBudget.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: "#c9a84c", fontWeight: 700 }}>${totalSpend.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: totalRemaining < 0 ? "#c87878" : "#8fbc8f", fontWeight: 700 }}>{totalRemaining < 0 ? "-" : ""}${Math.abs(totalRemaining).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{overallPct}% used</div>
                <div style={{ fontSize: 13, color: "#e8e4dc", fontWeight: 700 }}>{items.length}</div>
              </div>
            </div>

            {/* Spend by type */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 16 }}>Spend by Item Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1, border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden" }}>
              {typeBreakdown().map(([type, amount]) => (
                <div key={type} style={{ padding: "14px 16px", background: "#0d0d10", borderRight: "1px solid #1a1a20", borderBottom: "1px solid #1a1a20" }}>
                  <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{type}</div>
                  <div style={{ fontSize: 18, color: "#c9a84c" }}>${amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#333", marginTop: 3 }}>{totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0}% of spend</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETAILED VIEW */}
        {view === "detailed" && (
          <div>
            {wardrobes.map(w => {
              const wi = wItems(w.id);
              const spend = wSpend(w.id);
              const rem = w.budget - spend;
              const pct = w.budget > 0 ? Math.min(100, Math.round((spend / w.budget) * 100)) : 0;
              return (
                <div key={w.id} style={{ marginBottom: 40 }}>
                  {/* Collection header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${w.accent}22` }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: w.accent }} />
                        <div style={{ fontSize: 16, color: "#e8e4dc" }}>{w.name}</div>
                      </div>
                      {w.description && <div style={{ fontSize: 11, color: "#444", maxWidth: 480, lineHeight: 1.5, marginLeft: 15 }}>{w.description}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, color: w.accent }}>${spend.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 2 }}>of ${Number(w.budget || 0).toLocaleString()} budget · {rem < 0 ? <span style={{ color: "#c87878" }}>${Math.abs(rem).toLocaleString()} over</span> : <span style={{ color: "#8fbc8f" }}>${rem.toLocaleString()} left</span>}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ height: 3, background: "#181820", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct > 90 ? "#c87878" : w.accent }} />
                  </div>

                  {wi.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#2a2a2a", fontStyle: "italic", padding: "12px 0" }}>No pieces added yet</div>
                  ) : (
                    <div style={{ border: "1px solid #1a1a20", borderRadius: 3, overflow: "hidden" }}>
                      {wi.map((item, idx) => (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px", alignItems: "center", padding: "10px 14px", background: "#0d0d10", borderBottom: idx < wi.length - 1 ? "1px solid #1a1a20" : "none" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#111116"} onMouseLeave={e => e.currentTarget.style.background = "#0d0d10"}>
                          <div style={{ width: 32, height: 32, borderRadius: 2, background: item.image ? `url(${item.image}) center/cover` : "#181820", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                            {!item.image && { Top: "👕", Bottom: "👖", Footwear: "👟", Outerwear: "🧥", Bag: "👜", Suit: "🤵", Dress: "👗", Swimwear: "🩱", Accessory: "✦" }[item.type] || "●"}
                          </div>
                          <div style={{ paddingLeft: 12 }}>
                            <div style={{ fontSize: 12, color: "#e8e4dc", marginBottom: 2 }}>{item.name}</div>
                            <div style={{ fontSize: 10, color: "#333" }}>
                              {(item.brand || [])[0] && <>{item.brand[0]} · </>}{item.type}
                              {(item.occasion || []).length > 0 && <> · {item.occasion.slice(0, 2).join(", ")}</>}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, color: w.accent, textAlign: "right" }}>${Number(item.price || 0).toLocaleString()}</div>
                        </div>
                      ))}
                      {/* Subtotal */}
                      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px", alignItems: "center", padding: "10px 14px", background: "#111116", borderTop: "1px solid #2a2a2a" }}>
                        <div />
                        <div style={{ paddingLeft: 12, fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>{wi.length} piece{wi.length !== 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 14, color: w.accent, textAlign: "right", fontWeight: 700 }}>${spend.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Grand total */}
            <div style={{ border: "1px solid #c9a84c22", borderRadius: 4, padding: "20px 24px", background: "#0d0d10", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Grand Total</div>
                <div style={{ fontSize: 11, color: "#444" }}>{wardrobes.length} collections · {items.length} pieces</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, color: "#c9a84c" }}>${totalSpend.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>of ${totalBudget.toLocaleString()} total budget</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

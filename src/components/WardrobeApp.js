'use client'

import { useState, useEffect, useRef } from "react";

const WARDROBES_DEFAULT = [
  { id: 1, name: "After-Hours Assets", budget: 2000, accent: "#c9a84c" },
  { id: 2, name: "The 203 Collection", budget: 2500, accent: "#7eb8d4" },
  { id: 3, name: "The Greenwich Standard", budget: 3000, accent: "#8fbc8f" },
  { id: 4, name: "Old Money Staples", budget: 4000, accent: "#c8a96e" },
  { id: 5, name: "PSU 2nd & 3rd Quarter", budget: 1500, accent: "#849bcf" },
  { id: 6, name: "Kennebunkport Classics", budget: 2800, accent: "#a8c4d4" },
  { id: 7, name: "The Deacon's Suitcase", budget: 2200, accent: "#b5896a" },
  { id: 8, name: "Move In Boulder", budget: 1800, accent: "#a0a8d4" },
  { id: 9, name: "Winter Elevation", budget: 2600, accent: "#9ab5d4" },
  { id: 10, name: "Buff Winterline", budget: 2000, accent: "#d4b896" },
  { id: 11, name: "Hoosier Freeze", budget: 1800, accent: "#b89fd4" },
  { id: 12, name: "Palm Shadow", budget: 2400, accent: "#6db89a" },
  { id: 13, name: "Catalina Bloom", budget: 2200, accent: "#d496b8" },
  { id: 14, name: "Chestnut Season", budget: 2000, accent: "#c87840" },
  { id: 15, name: "Scarlet Walk", budget: 1900, accent: "#d46464" },
  { id: 16, name: "Sixth Street Shift", budget: 2100, accent: "#7878d4" },
];

const OCCASION_TAGS = ["Dinner", "Beach", "City", "Brunch", "Party", "Travel", "Hiking", "Date Night", "Game Day", "Formal", "Casual Friday", "Resort"];
const SEASON_TAGS = ["Spring", "Summer", "Fall", "Winter", "All Season"];
const VIBE_TAGS = ["Preppy", "Old Money", "Streetwear", "Coastal", "Minimalist", "Business Casual", "Athletic", "Boho", "Classic", "Trendy", "Rugged", "Luxe"];
const COLOR_TAGS = ["Black", "White", "Navy", "Grey", "Beige", "Brown", "Olive", "Burgundy", "Camel", "Cream", "Forest Green", "Sky Blue", "Rust", "Blush", "Charcoal"];
const BRAND_TAGS = ["COS", "ARKET", "ASKET", "Buck Mason", "Taylor Stitch", "Club Monaco", "Faherty", "Marine Layer", "J.Crew", "Banana Republic", "Bonobos", "Lululemon", "Vuori", "Rhone", "Peter Millar", "Rhoback", "Patagonia", "Levi's", "Ralph Lauren", "Uniqlo", "Other"];
const ITEM_TYPES = ["Top", "Bottom", "Outerwear", "Shoes", "Accessory", "Bag", "Swimwear", "Suit", "Dress"];
const BLANK_ITEM = { name: "", price: "", type: "Top", url: "", image: "", occasion: [], season: [], vibe: [], color: [], brand: [], wardrobeId: null, notes: "" };

export default function WardrobeApp() {
  const [wardrobes, setWardrobes] = useState(WARDROBES_DEFAULT);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeWardrobe, setActiveWardrobe] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [outfitMode, setOutfitMode] = useState(false);
  const [outfitPicks, setOutfitPicks] = useState([]);
  const [filterOccasion, setFilterOccasion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [newItem, setNewItem] = useState({ ...BLANK_ITEM });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [toast, setToast] = useState(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedWardrobes = localStorage.getItem("dc-wardrobes");
      const savedItems = localStorage.getItem("dc-items");
      if (savedWardrobes) setWardrobes(JSON.parse(savedWardrobes));
      if (savedItems) setItems(JSON.parse(savedItems));
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("dc-wardrobes", JSON.stringify(wardrobes));
  }, [wardrobes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("dc-items", JSON.stringify(items));
  }, [items, loaded]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };
  const wardrobeItems = (wId) => items.filter(i => i.wardrobeId === wId);
  const wardrobeSpend = (wId) => wardrobeItems(wId).reduce((s, i) => s + Number(i.price || 0), 0);
  const totalSpend = items.reduce((s, i) => s + Number(i.price || 0), 0);
  const totalBudget = wardrobes.reduce((s, w) => s + Number(w.budget || 0), 0);
  const budgetPct = (wId) => { const w = wardrobes.find(x => x.id === wId); if (!w?.budget) return 0; return Math.min(100, Math.round((wardrobeSpend(wId) / w.budget) * 100)); };
  const activeWardrobeData = wardrobes.find(w => w.id === activeWardrobe);

  const filteredItems = () => {
    let list = activeWardrobe ? wardrobeItems(activeWardrobe) : items;
    if (filterOccasion) list = list.filter(i => (i.occasion || []).includes(filterOccasion));
    if (searchQuery) list = list.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.brand || []).some(b => b.toLowerCase().includes(searchQuery.toLowerCase())));
    return list;
  };

  const fetchFromUrl = async (url) => {
    if (!url?.startsWith("http")) { setUrlError("Please enter a valid URL starting with http"); return; }
    setFetchingUrl(true); setUrlError("");
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      const data = await res.json();
      const doc = new DOMParser().parseFromString(data.contents, "text/html");
      const meta = (p) => doc.querySelector(`meta[property="${p}"]`)?.content || doc.querySelector(`meta[name="${p}"]`)?.content || "";
      const title = meta("og:title") || doc.title || "";
      const image = meta("og:image") || meta("twitter:image") || "";
      const price = meta("product:price:amount") || meta("og:price:amount") || "";
      const domain = new URL(url).hostname.replace("www.", "");
      const detectedBrand = BRAND_TAGS.find(b => domain.toLowerCase().includes(b.toLowerCase().replace(/\s/g, ""))) || "";
      setNewItem(prev => ({ ...prev, url, name: title.split("|")[0].split(" – ")[0].trim().slice(0, 60) || prev.name, image, price: price ? parseFloat(price).toFixed(0) : prev.price, brand: detectedBrand ? [detectedBrand] : prev.brand }));
    } catch (e) { setUrlError("Couldn't auto-fetch — fill in details manually"); }
    setFetchingUrl(false);
  };

  const toggleTag = (key, val) => setNewItem(prev => ({ ...prev, [key]: (prev[key] || []).includes(val) ? prev[key].filter(x => x !== val) : [...(prev[key] || []), val] }));

  const saveItem = () => {
    if (!newItem.name.trim()) return;
    const wId = Number(newItem.wardrobeId) || activeWardrobe || wardrobes[0].id;
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...newItem, id: editingItem.id, wardrobeId: wId } : i));
      showToast("Piece updated ✓");
    } else {
      setItems(prev => [...prev, { ...newItem, id: Date.now(), wardrobeId: wId }]);
      showToast("Piece added ✓");
    }
    resetForm();
  };

  const resetForm = () => { setNewItem({ ...BLANK_ITEM }); setEditingItem(null); setShowAddItem(false); setUrlError(""); };
  const startEdit = (item) => { setNewItem({ ...item }); setEditingItem(item); setShowAddItem(true); };
  const deleteItem = (id) => { setItems(prev => prev.filter(i => i.id !== id)); showToast("Removed"); };
  const toggleOutfitPick = (item) => setOutfitPicks(prev => prev.find(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]);
  const typeIcon = (type) => ({ Top: "👕", Bottom: "👖", Shoes: "👟", Outerwear: "🧥", Bag: "👜", Suit: "🤵", Dress: "👗", Swimwear: "🩱", Accessory: "✦" }[type] || "✦");

  if (!loaded) return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#c9a84c", letterSpacing: "0.2em", fontSize: 12, textTransform: "uppercase" }}>
      Loading Davenport...
    </div>
  );

  return (
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#e8e4dc", fontFamily: "Georgia, 'Times New Roman', serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#c9a84c", color: "#0a0a0c", padding: "10px 22px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", zIndex: 999, textTransform: "uppercase" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a20", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, background: "#0a0a0c", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ letterSpacing: "0.28em", fontSize: 12, color: "#c9a84c", textTransform: "uppercase", cursor: "pointer" }} onClick={() => { setActiveWardrobe(null); setOutfitMode(false); setOutfitPicks([]); }}>Davenport</span>
          <span style={{ width: 1, height: 16, background: "#222" }} />
          <span style={{ letterSpacing: "0.15em", fontSize: 10, color: "#3a3a3a", textTransform: "uppercase" }}>Wardrobe</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {activeWardrobe && <>
            <button onClick={() => { setOutfitMode(!outfitMode); setOutfitPicks([]); }}
              style={{ padding: "5px 12px", borderRadius: 3, border: `1px solid ${outfitMode ? "#c9a84c" : "#1e1e24"}`, background: outfitMode ? "#c9a84c15" : "none", color: outfitMode ? "#c9a84c" : "#555", cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {outfitMode ? "✓ Outfit Mode" : "Outfit Mode"}
            </button>
            <button onClick={() => { setNewItem({ ...BLANK_ITEM, wardrobeId: activeWardrobe }); setShowAddItem(true); }}
              style={{ padding: "5px 14px", borderRadius: 3, border: "none", background: "#c9a84c", color: "#0a0a0c", cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
              + Add Piece
            </button>
            <button onClick={() => { setActiveWardrobe(null); setFilterOccasion(null); setSearchQuery(""); setOutfitMode(false); setOutfitPicks([]); }}
              style={{ padding: "5px 12px", borderRadius: 3, border: "1px solid #1e1e24", background: "none", color: "#555", cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ← All
            </button>
          </>}
        </div>
      </div>

      {/* Outfit Bar */}
      {outfitMode && outfitPicks.length > 0 && (
        <div style={{ background: "#0c0c0f", borderBottom: "1px solid #c9a84c22", padding: "10px 32px", display: "flex", alignItems: "center", gap: 10, overflowX: "auto" }}>
          <span style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}>Outfit Preview</span>
          {outfitPicks.map(item => (
            <div key={item.id} style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 3, background: item.image ? `url(${item.image}) center/cover` : "#1a1a20", border: "1px solid #c9a84c44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {!item.image && typeIcon(item.type)}
              </div>
              <div style={{ fontSize: 9, color: "#555", marginTop: 2, maxWidth: 48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", flexShrink: 0, fontSize: 12, color: "#888" }}>
            Total: <span style={{ color: "#c9a84c" }}>${outfitPicks.reduce((s, i) => s + Number(i.price || 0), 0).toLocaleString()}</span>
          </div>
          <button onClick={() => setOutfitPicks([])} style={{ background: "none", border: "1px solid #222", color: "#444", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 10, flexShrink: 0 }}>Clear</button>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", marginBottom: 36, border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden" }}>
          {[
            { label: "Collections", value: wardrobes.length },
            { label: "Total Pieces", value: items.length },
            { label: "Total Value", value: `$${totalSpend.toLocaleString()}` },
            { label: "Budget Left", value: `$${Math.max(0, totalBudget - totalSpend).toLocaleString()}` },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "18px 22px", background: "#0d0d10", borderRight: i < 3 ? "1px solid #1a1a20" : "none" }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, color: i === 2 ? "#c9a84c" : "#e8e4dc" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Overview */}
        {!activeWardrobe && (
          <div>
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 16 }}>All Collections</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 1, border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden" }}>
              {wardrobes.map((w) => {
                const spend = wardrobeSpend(w.id);
                const pct = budgetPct(w.id);
                const wItems = wardrobeItems(w.id);
                return (
                  <div key={w.id} style={{ background: "#0d0d10", padding: "20px 22px", borderRight: "1px solid #1a1a20", borderBottom: "1px solid #1a1a20", transition: "background 0.18s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111116"}
                    onMouseLeave={e => e.currentTarget.style.background = "#0d0d10"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: w.accent, marginBottom: 7 }} />
                        <div style={{ fontSize: 13, color: "#e8e4dc", marginBottom: 2 }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: "#3a3a3a" }}>{wItems.length} piece{wItems.length !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, color: w.accent }}>${spend.toLocaleString()}</div>
                        {editingBudgetId === w.id ? (
                          <input autoFocus value={budgetDraft} onChange={e => setBudgetDraft(e.target.value)}
                            onBlur={() => { setWardrobes(prev => prev.map(x => x.id === w.id ? { ...x, budget: Number(budgetDraft) } : x)); setEditingBudgetId(null); }}
                            onKeyDown={e => e.key === "Enter" && e.target.blur()}
                            style={{ width: 70, background: "none", border: "none", borderBottom: `1px solid ${w.accent}`, color: w.accent, fontSize: 10, textAlign: "right", padding: "1px 2px", outline: "none" }} />
                        ) : (
                          <div onClick={() => { setEditingBudgetId(w.id); setBudgetDraft(String(w.budget)); }}
                            style={{ fontSize: 10, color: "#3a3a3a", cursor: "pointer", borderBottom: "1px dashed #2a2a2a" }}>
                            ${w.budget?.toLocaleString()} budget
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 2, background: "#181820", borderRadius: 1, marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct > 90 ? "#c87878" : w.accent, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14, minHeight: 36 }}>
                      {wItems.slice(0, 9).map(item => (
                        <div key={item.id} style={{ width: 30, height: 30, borderRadius: 2, background: item.image ? `url(${item.image}) center/cover` : "#181820", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                          {!item.image && typeIcon(item.type)}
                        </div>
                      ))}
                      {wItems.length > 9 && <div style={{ width: 30, height: 30, borderRadius: 2, background: "#181820", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444" }}>+{wItems.length - 9}</div>}
                    </div>
                    <button onClick={() => { setActiveWardrobe(w.id); setFilterOccasion(null); setSearchQuery(""); }}
                      style={{ width: "100%", padding: "7px 0", borderRadius: 3, border: `1px solid ${w.accent}33`, background: "none", color: w.accent, cursor: "pointer", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      Open Collection →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wardrobe Detail */}
        {activeWardrobe && activeWardrobeData && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: activeWardrobeData.accent }} />
                  <div style={{ fontSize: 20, color: "#e8e4dc" }}>{activeWardrobeData.name}</div>
                </div>
                <div style={{ fontSize: 11, color: "#444" }}>
                  {wardrobeItems(activeWardrobe).length} pieces · ${wardrobeSpend(activeWardrobe).toLocaleString()} of ${activeWardrobeData.budget?.toLocaleString()} ({budgetPct(activeWardrobe)}%)
                </div>
              </div>
              <div style={{ width: 180 }}>
                <div style={{ height: 3, background: "#181820", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${budgetPct(activeWardrobe)}%`, background: budgetPct(activeWardrobe) > 90 ? "#c87878" : activeWardrobeData.accent }} />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                style={{ padding: "5px 10px", borderRadius: 3, border: "1px solid #1a1a20", background: "#0d0d10", color: "#e8e4dc", fontSize: 11, width: 140, outline: "none" }} />
              <div style={{ width: 1, height: 16, background: "#1a1a20" }} />
              {OCCASION_TAGS.map(tag => (
                <button key={tag} onClick={() => setFilterOccasion(filterOccasion === tag ? null : tag)}
                  style={{ padding: "4px 9px", borderRadius: 3, border: `1px solid ${filterOccasion === tag ? activeWardrobeData.accent : "#1a1a20"}`, background: filterOccasion === tag ? activeWardrobeData.accent + "18" : "none", color: filterOccasion === tag ? activeWardrobeData.accent : "#444", cursor: "pointer", fontSize: 10 }}>
                  {tag}
                </button>
              ))}
              {(filterOccasion || searchQuery) && (
                <button onClick={() => { setFilterOccasion(null); setSearchQuery(""); }}
                  style={{ padding: "4px 9px", borderRadius: 3, border: "1px solid #c8787833", background: "none", color: "#c87878", cursor: "pointer", fontSize: 10 }}>
                  Clear ×
                </button>
              )}
            </div>

            {/* Items Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 1, border: "1px solid #1a1a20", borderRadius: 4, overflow: "hidden" }}>
              {filteredItems().map(item => {
                const picked = outfitPicks.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="item-card"
                    style={{ background: picked ? "#13130e" : "#0d0d10", borderBottom: "1px solid #1a1a20", borderRight: "1px solid #1a1a20", cursor: outfitMode ? "pointer" : "default", outline: picked ? `2px solid ${activeWardrobeData.accent}` : "none", position: "relative" }}
                    onClick={() => outfitMode && toggleOutfitPick(item)}>
                    <div style={{ height: 190, background: item.image ? `url(${item.image}) center/cover no-repeat` : "#111116", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, position: "relative" }}>
                      {!item.image && typeIcon(item.type)}
                      {picked && <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: activeWardrobeData.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#0a0a0c", fontWeight: 700 }}>✓</div>}
                      {!outfitMode && (
                        <div className="item-actions" style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
                          <button onClick={(e) => { e.stopPropagation(); startEdit(item); }} style={{ background: "#000000cc", border: "none", color: "#e8e4dc", borderRadius: 2, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>✏</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: "#000000cc", border: "none", color: "#c87878", borderRadius: 2, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: 6, left: 6, display: "flex", gap: 3 }}>
                        {(item.vibe || []).slice(0, 2).map(v => <span key={v} style={{ background: "#000000bb", color: "#666", borderRadius: 2, padding: "2px 5px", fontSize: 9 }}>{v}</span>)}
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                        <div style={{ fontSize: 12, color: "#e8e4dc", lineHeight: 1.3, flex: 1, marginRight: 6 }}>{item.name}</div>
                        <div style={{ fontSize: 14, color: activeWardrobeData.accent, flexShrink: 0 }}>${item.price}</div>
                      </div>
                      <div style={{ fontSize: 10, color: "#3a3a3a", marginBottom: 7 }}>
                        {(item.brand || [])[0] && <>{item.brand[0]} · </>}{item.type}
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {(item.occasion || []).slice(0, 2).map(o => <span key={o} style={{ background: "#141418", color: "#444", borderRadius: 2, padding: "2px 5px", fontSize: 9 }}>{o}</span>)}
                        {(item.season || []).slice(0, 1).map(s => <span key={s} style={{ background: "#141418", color: "#444", borderRadius: 2, padding: "2px 5px", fontSize: 9 }}>{s}</span>)}
                      </div>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ display: "block", marginTop: 9, fontSize: 10, color: "#3a3a3a", textDecoration: "none", letterSpacing: "0.07em" }}>
                          View Product →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add tile */}
              <div onClick={() => { setNewItem({ ...BLANK_ITEM, wardrobeId: activeWardrobe }); setShowAddItem(true); }}
                style={{ background: "#0a0a0c", borderBottom: "1px solid #1a1a20", borderRight: "1px solid #1a1a20", minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 8, transition: "background 0.18s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#0d0d10"}
                onMouseLeave={e => e.currentTarget.style.background = "#0a0a0c"}>
                <div style={{ width: 32, height: 32, border: "1px dashed #222", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2a2a2a", fontSize: 18 }}>+</div>
                <div style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Add Piece</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddItem && (
        <div style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#0d0d10", border: "1px solid #1a1a20", borderRadius: 6, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #1a1a20", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0d0d10", zIndex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c9a84c" }}>{editingItem ? "Edit Piece" : "Add New Piece"}</div>
              <button onClick={resetForm} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: "20px 24px" }}>

              {/* URL */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>Product Link</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newItem.url} onChange={e => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && fetchFromUrl(newItem.url)}
                    placeholder="Paste URL then hit Auto-Fill..."
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 3, border: "1px solid #1a1a20", background: "#060608", color: "#e8e4dc", fontSize: 12, outline: "none" }} />
                  <button onClick={() => fetchFromUrl(newItem.url)} disabled={fetchingUrl}
                    style={{ padding: "8px 14px", borderRadius: 3, border: "none", background: "#c9a84c", color: "#0a0a0c", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: fetchingUrl ? 0.6 : 1, whiteSpace: "nowrap" }}>
                    {fetchingUrl ? "Fetching..." : "Auto-Fill"}
                  </button>
                </div>
                {urlError && <div style={{ fontSize: 11, color: "#c87878", marginTop: 5 }}>{urlError}</div>}
              </div>

              {newItem.image && (
                <div style={{ marginBottom: 16 }}>
                  <img src={newItem.image} alt="" onError={e => e.target.style.display = "none"}
                    style={{ width: "100%", height: 150, objectFit: "contain", borderRadius: 3, background: "#060608", border: "1px solid #1a1a20" }} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 14 }}>
                {[{ l: "Item Name", k: "name", t: "text", ph: "e.g. Merino Crewneck" }, { l: "Price ($)", k: "price", t: "number", ph: "0" }].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{f.l}</div>
                    <input type={f.t} value={newItem[f.k]} placeholder={f.ph} onChange={e => setNewItem(prev => ({ ...prev, [f.k]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 3, border: "1px solid #1a1a20", background: "#060608", color: "#e8e4dc", fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Type</div>
                  <select value={newItem.type} onChange={e => setNewItem(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 3, border: "1px solid #1a1a20", background: "#060608", color: "#e8e4dc", fontSize: 12 }}>
                    {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Wardrobe</div>
                  <select value={newItem.wardrobeId || activeWardrobe || wardrobes[0].id}
                    onChange={e => setNewItem(prev => ({ ...prev, wardrobeId: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 3, border: "1px solid #1a1a20", background: "#060608", color: "#e8e4dc", fontSize: 12 }}>
                    {wardrobes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              {[
                { label: "Occasion", key: "occasion", tags: OCCASION_TAGS },
                { label: "Season", key: "season", tags: SEASON_TAGS },
                { label: "Vibe", key: "vibe", tags: VIBE_TAGS },
                { label: "Color", key: "color", tags: COLOR_TAGS },
                { label: "Brand", key: "brand", tags: BRAND_TAGS },
              ].map(sec => (
                <div key={sec.key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>{sec.label}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {sec.tags.map(tag => {
                      const on = (newItem[sec.key] || []).includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTag(sec.key, tag)}
                          style={{ padding: "4px 9px", borderRadius: 3, border: `1px solid ${on ? "#c9a84c" : "#1a1a20"}`, background: on ? "#c9a84c15" : "none", color: on ? "#c9a84c" : "#3a3a3a", cursor: "pointer", fontSize: 11 }}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button onClick={saveItem}
                style={{ width: "100%", padding: "11px 0", borderRadius: 3, border: "none", background: "#c9a84c", color: "#0a0a0c", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>
                {editingItem ? "Save Changes" : "Add to Wardrobe"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .item-card:hover .item-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

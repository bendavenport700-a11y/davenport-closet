'use client'

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const sb = (path: string, opts: any = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "",
    },
    ...opts,
  });

const WARDROBES_DEFAULT = [
  { name: "After-Hours Assets", budget: 2000, accent: "#c9a84c", description: "Elevated evening wear — dark blazers, tailored trousers, polished shoes." },
  { name: "The 203 Collection", budget: 2500, accent: "#7eb8d4", description: "East Coast prep meets modern fit. Chinos, OCBD shirts, quarter-zips, clean sneakers." },
  { name: "The Greenwich Standard", budget: 3000, accent: "#8fbc8f", description: "Connecticut old money — linen, navy, khaki. Timeless pieces built for longevity." },
  { name: "Old Money Staples", budget: 4000, accent: "#c8a96e", description: "Investment pieces that last decades. Cashmere, leather, heritage brands." },
  { name: "PSU 2nd & 3rd Quarter", budget: 1500, accent: "#849bcf", description: "Game day and campus casual. Comfortable, versatile pieces in navy and white." },
  { name: "Kennebunkport Classics", budget: 2800, accent: "#a8c4d4", description: "Maine coastal prep — boat shoes, weathered canvas, light layers." },
  { name: "The Deacon's Suitcase", budget: 2200, accent: "#b5896a", description: "Southern gentleman meets prep school. Madras, seersucker, loafers." },
  { name: "Move In Boulder", budget: 1800, accent: "#a0a8d4", description: "Colorado casual — technical fabrics, earth tones, trail-ready." },
  { name: "Winter Elevation", budget: 2600, accent: "#9ab5d4", description: "Ski town style — flannels, shearling, heavyweight knits." },
  { name: "Buff Winterline", budget: 2000, accent: "#d4b896", description: "CU Boulder winter — neutral tones, layering pieces, warm outerwear." },
  { name: "Hoosier Freeze", budget: 1800, accent: "#b89fd4", description: "Indiana winter essentials — practical warmth with style." },
  { name: "Palm Shadow", budget: 2400, accent: "#6db89a", description: "Florida coastal — linen shirts, resort shorts, sandals." },
  { name: "Catalina Bloom", budget: 2200, accent: "#d496b8", description: "California island weekend — relaxed pastels, light knits, casual footwear." },
  { name: "Chestnut Season", budget: 2000, accent: "#c87840", description: "Fall transition pieces — rich earth tones, corduroys, flannel, leather boots." },
  { name: "Scarlet Walk", budget: 1900, accent: "#d46464", description: "Ohio State game day and campus. Scarlet and grey palette, comfortable layers." },
  { name: "Sixth Street Shift", budget: 2100, accent: "#7878d4", description: "Austin night out — relaxed but intentional. Dark denim, graphic tees, boots." },
];

const DEFAULT_TAGS: Record<string, string[]> = {
  occasion: ["Everyday","Work","Dinner","Brunch","Date Night","Party","Beach","Travel","Gym","Hiking","Game Day","Wedding","Bar Night","Vacation","Formal"],
  season: ["Spring","Summer","Fall","Winter","All Season","Hot Weather","Cold Weather","Rain","Layering Piece"],
  vibe: ["Preppy","Old Money","Streetwear","Coastal","Minimalist","Business Casual","Athletic","Boho","Classic","Trendy","Rugged","Luxe","Ivy League","Scandinavian","Vintage","Americana","Smart Casual","Modern","Relaxed","Elevated Casual","Workwear"],
  color: ["Black","White","Navy","Grey","Charcoal","Beige","Tan","Khaki","Brown","Camel","Cream","Olive","Forest Green","Sky Blue","Burgundy","Rust","Blush","Stone","Indigo"],
  fit: ["Slim","Regular","Relaxed","Tailored","Tapered","Oversized","Athletic Fit"],
  clothing_type: ["T-Shirt","Polo","Henley","Oxford Shirt","Button-Down","Dress Shirt","Sweater","Cardigan","Hoodie","Crewneck","Blazer","Jacket","Overcoat","Bomber","Denim Jacket","Field Jacket","Vest","Jeans","Chinos","Shorts","Dress Pants","Joggers","Sweatpants","Athletic Shorts","Swim Trunks"],
  fabric: ["Cotton","Linen","Wool","Cashmere","Denim","Corduroy","Knit","Fleece","Leather","Performance Fabric"],
  layering: ["Base Layer","Mid Layer","Outer Layer","Statement Piece","Foundation Piece"],
  formality: ["Casual","Smart Casual","Business Casual","Business","Formal"],
  pattern: ["Solid","Striped","Plaid","Checkered","Graphic","Textured"],
  function: ["Performance","Breathable","Waterproof","Stretch","Packable","Wrinkle-Resistant"],
  comfort: ["High Comfort","Medium Comfort","Structured"],
  brand: ["COS","ARKET","ASKET","Buck Mason","Taylor Stitch","Club Monaco","Faherty","Marine Layer","J.Crew","Banana Republic","Bonobos","Lululemon","Vuori","Rhone","Peter Millar","Rhoback","Patagonia","Levi's","Ralph Lauren","Uniqlo","Other"],
};

const TAG_LABELS: Record<string, string> = {
  occasion:"Occasion", season:"Season / Weather", vibe:"Vibe / Style", color:"Color",
  fit:"Fit", clothing_type:"Clothing Type", fabric:"Fabric / Material",
  layering:"Layering Role", formality:"Formality", pattern:"Pattern",
  function:"Function", comfort:"Comfort", brand:"Brand",
};

const ACCENT_COLORS = ["#c9a84c","#7eb8d4","#8fbc8f","#c8a96e","#849bcf","#a8c4d4","#b5896a","#a0a8d4","#9ab5d4","#d4b896","#b89fd4","#6db89a","#d496b8","#c87840","#d46464","#7878d4","#e8e4dc","#c87878"];
const ITEM_TYPES = ["Top","Bottom","Outerwear","Shoes","Accessory","Bag","Swimwear","Suit","Dress"];
const BLANK_ITEM = { name:"", price:"", type:"Top", url:"", image:"", wardrobe_id:null as any, ...Object.fromEntries(Object.keys(DEFAULT_TAGS).map(k => [k, [] as string[]])) };
const BLANK_COLLECTION = { name:"", budget:"", accent:"#c9a84c", description:"" };

const fmt = (n: any) => `$${Number(n||0).toLocaleString()}`;
const pct = (spend: number, budget: number) => budget ? Math.min(100, Math.round((spend/budget)*100)) : 0;
const typeIcon = (t: string) => (({Top:"👕",Bottom:"👖",Shoes:"👟",Outerwear:"🧥",Bag:"👜",Suit:"🤵",Dress:"👗",Swimwear:"🩱",Accessory:"✦"} as any)[t] || "✦");

const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export default function WardrobeApp() {
  const [wardrobes, setWardrobes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("closet");
  const [activeWardrobe, setActiveWardrobe] = useState<any>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [outfitMode, setOutfitMode] = useState(false);
  const [outfitPicks, setOutfitPicks] = useState<any[]>([]);
  const [filterOccasion, setFilterOccasion] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [newItem, setNewItem] = useState({...BLANK_ITEM});
  const [editingBudgetId, setEditingBudgetId] = useState<any>(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [toast, setToast] = useState<string|null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [newCollection, setNewCollection] = useState({...BLANK_COLLECTION});
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [editingDescription, setEditingDescription] = useState<any>(null);
  const [descDraft, setDescDraft] = useState("");
  const [showTagManager, setShowTagManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCollection, setSavingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadAll = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { setLoading(false); return; }
    try {
      const [wRes, iRes, tRes] = await Promise.all([
        sb("wardrobes?order=created_at").then((r: any) => r.json()),
        sb("items?order=created_at").then((r: any) => r.json()),
        sb("tags?limit=1").then((r: any) => r.json()),
      ]);
      if (Array.isArray(wRes) && wRes.length === 0) {
        const s = await sb("wardrobes", { method:"POST", prefer:"return=representation", body:JSON.stringify(WARDROBES_DEFAULT) });
        setWardrobes(await s.json());
      } else setWardrobes(Array.isArray(wRes) ? wRes : []);
      setItems(Array.isArray(iRes) ? iRes : []);
      if (Array.isArray(tRes) && tRes.length === 0) {
        await sb("tags", { method:"POST", prefer:"return=representation", body:JSON.stringify({id:1, data:DEFAULT_TAGS}) });
        setTags(DEFAULT_TAGS);
      } else if (Array.isArray(tRes) && tRes[0]) setTags({...DEFAULT_TAGS, ...tRes[0].data});
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Wardrobe CRUD ──
  const createWardrobe = async (data: any) => {
    const r = await sb("wardrobes", { method:"POST", prefer:"return=representation", body:JSON.stringify(data) });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Failed to create collection (${r.status}): ${text}`);
    }
    const d = await r.json();
    if (Array.isArray(d)) setWardrobes((p: any[]) => [...p, ...d]);
    showToast("Collection created ✓");
  };
  const updateWardrobe = async (id: any, data: any) => {
    const r = await sb(`wardrobes?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(data) });
    if (!r.ok) throw new Error(`Save failed (${r.status})`);
    setWardrobes((p: any[]) => p.map((w: any) => w.id === id ? {...w, ...data} : w));
    showToast("Saved ✓");
  };
  const deleteWardrobe = async (id: any) => {
    await sb(`items?wardrobe_id=eq.${id}`, { method:"DELETE" });
    await sb(`wardrobes?id=eq.${id}`, { method:"DELETE" });
    setItems((p: any[]) => p.filter((i: any) => i.wardrobe_id !== id));
    setWardrobes((p: any[]) => p.filter((w: any) => w.id !== id));
    if (activeWardrobe === id) setActiveWardrobe(null);
    showToast("Collection deleted");
  };

  // ── Item CRUD ──
  const createItem = async (data: any) => {
    const r = await sb("items", { method:"POST", prefer:"return=representation", body:JSON.stringify(data) });
    const d = await r.json();
    if (Array.isArray(d)) setItems((p: any[]) => [...p, ...d]);
    showToast("Piece added ✓");
  };
  const updateItem = async (id: any, data: any) => {
    await sb(`items?id=eq.${id}`, { method:"PATCH", body:JSON.stringify(data) });
    setItems((p: any[]) => p.map((i: any) => i.id === id ? {...i, ...data} : i));
    showToast("Piece updated ✓");
  };
  const deleteItemById = async (id: any) => {
    await sb(`items?id=eq.${id}`, { method:"DELETE" });
    setItems((p: any[]) => p.filter((i: any) => i.id !== id));
    showToast("Removed");
  };

  // ── Tags ──
  const saveTags = async (t: any) => {
    setTags(t);
    await sb("tags?id=eq.1", { method:"PATCH", body:JSON.stringify({data: t}) });
  };
  const addTag = async (cat: string, val: string) => {
    const v = val.trim();
    if (!v || (tags[cat] || []).includes(v)) return;
    await saveTags({...tags, [cat]: [...(tags[cat] || []), v]});
    showToast(`"${v}" added ✓`);
  };
  const removeTag = async (cat: string, val: string) => {
    const updated = {...tags, [cat]: tags[cat].filter((t: string) => t !== val)};
    await saveTags(updated);
    const affected = items.filter((i: any) => (i[cat] || []).includes(val));
    for (const item of affected) {
      const newCat = item[cat].filter((t: string) => t !== val);
      await sb(`items?id=eq.${item.id}`, { method:"PATCH", body:JSON.stringify({[cat]: newCat}) });
      setItems((p: any[]) => p.map((i: any) => i.id === item.id ? {...i, [cat]: newCat} : i));
    }
    showToast(`"${val}" removed`);
  };
  const addCategory = async () => {
    const key = newCategoryName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || tags[key]) return;
    await saveTags({...tags, [key]: []});
    setNewCategoryName("");
    showToast("Category added ✓");
  };
  const removeCategory = async (key: string) => {
    const updated = {...tags};
    delete updated[key];
    await saveTags(updated);
    showToast("Category removed");
  };

  const wItems = (id: any) => items.filter((i: any) => i.wardrobe_id === id);
  const wSpend = (id: any) => wItems(id).reduce((s: number, i: any) => s + Number(i.price || 0), 0);
  const totalSpend = items.reduce((s: number, i: any) => s + Number(i.price || 0), 0);
  const totalBudget = wardrobes.reduce((s: number, w: any) => s + Number(w.budget || 0), 0);
  const activeWD = wardrobes.find((w: any) => w.id === activeWardrobe);

  const filteredItems = () => {
    let list = activeWardrobe ? wItems(activeWardrobe) : items;
    if (filterOccasion) list = list.filter((i: any) => (i.occasion || []).includes(filterOccasion));
    if (searchQuery) list = list.filter((i: any) =>
      i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.brand || []).some((b: string) => b.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return list;
  };

  const fetchFromUrl = async (url: string) => {
    if (!url?.startsWith("http")) { setUrlError("Please enter a valid URL starting with http"); return; }
    setFetchingUrl(true); setUrlError("");
    let success = false;
    for (const proxy of PROXIES) {
      try {
        const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        const html = data.contents || data;
        if (!html || typeof html !== "string") continue;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const meta = (p: string) => doc.querySelector(`meta[property="${p}"]`)?.getAttribute("content") || doc.querySelector(`meta[name="${p}"]`)?.getAttribute("content") || "";
        const title = meta("og:title") || doc.title || "";
        const image = meta("og:image") || meta("twitter:image") || "";
        const price = meta("product:price:amount") || meta("og:price:amount") || "";
        const domain = new URL(url).hostname.replace("www.", "");
        const detectedBrand = (tags.brand || []).find((b: string) => domain.toLowerCase().includes(b.toLowerCase().replace(/\s/g, ""))) || "";
        setNewItem((prev: any) => ({
          ...prev, url,
          name: title.split("|")[0].split(" – ")[0].trim().slice(0, 60) || prev.name,
          image: image || prev.image,
          price: price ? parseFloat(price).toFixed(0) : prev.price,
          brand: detectedBrand ? [detectedBrand] : prev.brand,
        }));
        success = true; break;
      } catch(e) { continue; }
    }
    if (!success) setUrlError("Auto-fill didn't work for this site — fill in the details manually.");
    setFetchingUrl(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewItem((prev: any) => ({...prev, image: ev.target?.result}));
    reader.readAsDataURL(file);
  };

  const toggleTag = (key: string, val: string) => setNewItem((prev: any) => ({
    ...prev, [key]: (prev[key] || []).includes(val) ? prev[key].filter((x: string) => x !== val) : [...(prev[key] || []), val]
  }));

  const saveItem = async () => {
    if (!newItem.name.trim()) return;
    const wId = newItem.wardrobe_id || activeWardrobe || wardrobes[0]?.id;
    const payload = {...newItem, wardrobe_id: wId, price: Number(newItem.price) || 0};
    delete payload.id;
    editingItem ? await updateItem(editingItem.id, payload) : await createItem(payload);
    resetForm();
  };

  const resetForm = () => { setNewItem({...BLANK_ITEM}); setEditingItem(null); setShowAddItem(false); setUrlError(""); };
  const startEdit = (item: any) => { setNewItem({...item}); setEditingItem(item); setShowAddItem(true); };
  const toggleOutfit = (item: any) => setOutfitPicks((p: any[]) => p.find((i: any) => i.id === item.id) ? p.filter((i: any) => i.id !== item.id) : [...p, item]);

  // ── FIXED: saveCollection with proper error handling ──
  const saveCollection = async () => {
    if (!newCollection.name.trim()) {
      setCollectionError("Please enter a collection name.");
      return;
    }
    setCollectionError("");
    setSavingCollection(true);
    try {
      const payload = {...newCollection, budget: Number(newCollection.budget) || 0};
      if (editingCollection) {
        await updateWardrobe(editingCollection.id, payload);
      } else {
        await createWardrobe(payload);
      }
      setShowCollectionModal(false);
      setEditingCollection(null);
      setNewCollection({...BLANK_COLLECTION});
    } catch(err: any) {
      setCollectionError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSavingCollection(false);
    }
  };

  const openNewCollectionModal = () => {
    setEditingCollection(null);
    setNewCollection({...BLANK_COLLECTION});
    setCollectionError("");
    setShowCollectionModal(true);
  };

  const startEditCollection = (w: any) => {
    setNewCollection({ name: w.name, budget: String(w.budget), accent: w.accent, description: w.description || "" });
    setEditingCollection(w);
    setCollectionError("");
    setShowCollectionModal(true);
  };

  const saveDescription = async (id: any) => { await updateWardrobe(id, {description: descDraft}); setEditingDescription(null); };

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return (
    <div style={{background:"#0a0a0c",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",color:"#e8e4dc",padding:40}}>
      <div style={{maxWidth:480,textAlign:"center"}}>
        <div style={{fontSize:11,color:"#c9a84c",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>Davenport Closet</div>
        <div style={{fontSize:16,marginBottom:12}}>Database not connected</div>
        <div style={{fontSize:12,color:"#666",lineHeight:1.8}}>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel environment variables.</div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{background:"#0a0a0c",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",color:"#c9a84c",letterSpacing:"0.2em",fontSize:12,textTransform:"uppercase"}}>
      Loading Davenport...
    </div>
  );

  const S: any = {
    input: {padding:"9px 12px",borderRadius:4,border:"1px solid #252530",background:"#08080f",color:"#e8e4dc",fontSize:13,outline:"none",boxSizing:"border-box" as const,width:"100%",fontFamily:"Georgia,serif"},
    label: {fontSize:10,color:"#555",letterSpacing:"0.14em",textTransform:"uppercase" as const,marginBottom:7,display:"block"},
    modal: {position:"fixed" as const,inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16},
  };

  return (
    <div style={{background:"#0a0a0c",minHeight:"100vh",color:"#e8e4dc",fontFamily:"Georgia,'Times New Roman',serif"}}>

      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#c9a84c",color:"#0a0a0c",padding:"10px 24px",borderRadius:4,fontSize:11,fontWeight:700,letterSpacing:"0.12em",zIndex:999,textTransform:"uppercase",whiteSpace:"nowrap",boxShadow:"0 4px 24px rgba(201,168,76,0.35)"}}>
          {toast}
        </div>
      )}

      {/* ── NAV ── */}
      <div style={{borderBottom:"1px solid #181820",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,background:"#0a0a0c",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center"}}>
          <button onClick={() => { setPage("closet"); setActiveWardrobe(null); setOutfitMode(false); setOutfitPicks([]); }}
            style={{background:"none",border:"none",cursor:"pointer",padding:"0 20px 0 0",letterSpacing:"0.3em",fontSize:11,color:"#c9a84c",textTransform:"uppercase",fontWeight:700}}>
            Davenport
          </button>
          <div style={{width:1,height:18,background:"#1e1e28",marginRight:4}} />
          {[{id:"closet",label:"Closet"},{id:"budget",label:"Budget"}].map(tab => (
            <button key={tab.id} onClick={() => { setPage(tab.id); setActiveWardrobe(null); }}
              style={{background:"none",border:"none",cursor:"pointer",padding:"0 14px",height:56,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:page===tab.id?"#c9a84c":"#444",borderBottom:page===tab.id?"2px solid #c9a84c":"2px solid transparent",transition:"color 0.15s"}}>
              {tab.label}
            </button>
          ))}
          {activeWardrobe && activeWD && (
            <>
              <div style={{width:1,height:18,background:"#1e1e28",margin:"0 4px"}} />
              <button onClick={() => { setActiveWardrobe(null); setFilterOccasion(null); setSearchQuery(""); setOutfitMode(false); setOutfitPicks([]); }}
                style={{background:"none",border:"none",cursor:"pointer",padding:"0 10px",height:56,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"#333"}}>
                All
              </button>
              <span style={{fontSize:12,color:"#222",padding:"0 2px"}}>›</span>
              <span style={{padding:"0 10px",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:activeWD.accent}}>
                {activeWD.name}
              </span>
            </>
          )}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {page === "closet" && !activeWardrobe && (
            <>
              <button onClick={() => setShowTagManager(true)}
                style={{padding:"6px 14px",borderRadius:4,border:"1px solid #1e1e28",background:"none",color:"#555",cursor:"pointer",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase"}}>
                Tags
              </button>
              <button onClick={openNewCollectionModal}
                style={{padding:"7px 16px",borderRadius:4,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:15,lineHeight:1}}>+</span> New Collection
              </button>
            </>
          )}
          {page === "closet" && activeWardrobe && (
            <>
              <button onClick={() => { setOutfitMode(!outfitMode); setOutfitPicks([]); }}
                style={{padding:"6px 14px",borderRadius:4,border:`1px solid ${outfitMode?"#c9a84c44":"#1e1e28"}`,background:outfitMode?"#c9a84c10":"none",color:outfitMode?"#c9a84c":"#555",cursor:"pointer",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase"}}>
                {outfitMode ? "✓ Outfit" : "Outfit Mode"}
              </button>
              <button onClick={() => { setNewItem({...BLANK_ITEM, wardrobe_id:activeWardrobe}); setShowAddItem(true); }}
                style={{padding:"7px 16px",borderRadius:4,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:15,lineHeight:1}}>+</span> Add Piece
              </button>
            </>
          )}
        </div>
      </div>

      {outfitMode && outfitPicks.length > 0 && (
        <div style={{background:"#0c0c10",borderBottom:"1px solid #c9a84c18",padding:"10px 28px",display:"flex",alignItems:"center",gap:10,overflowX:"auto"}}>
          <span style={{fontSize:10,color:"#c9a84c",letterSpacing:"0.15em",textTransform:"uppercase",flexShrink:0}}>Outfit Preview</span>
          {outfitPicks.map((item: any) => (
            <div key={item.id} style={{flexShrink:0,textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:3,background:item.image?`url(${item.image}) center/cover`:"#1a1a22",border:"1px solid #c9a84c33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                {!item.image && typeIcon(item.type)}
              </div>
              <div style={{fontSize:9,color:"#555",marginTop:2,maxWidth:52,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
            </div>
          ))}
          <div style={{marginLeft:"auto",flexShrink:0,fontSize:12,color:"#888"}}>
            Total: <span style={{color:"#c9a84c"}}>${outfitPicks.reduce((s: number, i: any) => s + Number(i.price||0), 0).toLocaleString()}</span>
          </div>
          <button onClick={() => setOutfitPicks([])} style={{background:"none",border:"1px solid #222",color:"#444",borderRadius:3,padding:"4px 10px",cursor:"pointer",fontSize:10,flexShrink:0}}>Clear</button>
        </div>
      )}

      {/* ══════════ BUDGET PAGE ══════════ */}
      {page === "budget" && (
        <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 28px"}}>
          <div style={{marginBottom:36}}>
            <div style={{fontSize:10,color:"#333",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>Overview</div>
            <div style={{fontSize:26,color:"#e8e4dc",marginBottom:4}}>Budget Tracker</div>
            <div style={{fontSize:12,color:"#444"}}>{wardrobes.length} collections — financial summary</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,marginBottom:40,border:"1px solid #181820",borderRadius:6,overflow:"hidden"}}>
            {[
              {label:"Collections", value:wardrobes.length, sub:"active"},
              {label:"Total Budget", value:fmt(totalBudget), sub:"across all", gold:true},
              {label:"Total Spent", value:fmt(totalSpend), sub:`${pct(totalSpend,totalBudget)}% used`},
              {label:"Remaining", value:fmt(Math.max(0,totalBudget-totalSpend)), sub:totalSpend>totalBudget?"⚠ over budget":"available"},
            ].map((s,i) => (
              <div key={s.label} style={{padding:"22px 24px",background:"#0d0d12",borderRight:i<3?"1px solid #181820":"none"}}>
                <div style={{fontSize:10,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>{s.label}</div>
                <div style={{fontSize:24,color:(s as any).gold?"#c9a84c":"#e8e4dc",marginBottom:4}}>{s.value}</div>
                <div style={{fontSize:11,color:"#3a3a3a"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:40}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:10,color:"#444",letterSpacing:"0.12em",textTransform:"uppercase"}}>Overall Utilization</span>
              <span style={{fontSize:11,color:"#c9a84c"}}>{pct(totalSpend,totalBudget)}%</span>
            </div>
            <div style={{height:5,background:"#151520",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct(totalSpend,totalBudget)}%`,background:pct(totalSpend,totalBudget)>90?"#c87878":"#c9a84c",borderRadius:3,transition:"width 0.6s"}} />
            </div>
          </div>
          <div style={{fontSize:10,color:"#333",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>Collection Breakdown</div>
          <div style={{border:"1px solid #181820",borderRadius:6,overflow:"hidden",marginBottom:40}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 100px 60px 140px",padding:"10px 20px",background:"#0a0a0e",borderBottom:"1px solid #181820"}}>
              {["Collection","Budget","Spent","Left","Items","Progress"].map(h => (
                <div key={h} style={{fontSize:10,color:"#2a2a2a",letterSpacing:"0.1em",textTransform:"uppercase"}}>{h}</div>
              ))}
            </div>
            {wardrobes.map((w: any, idx: number) => {
              const spend = wSpend(w.id); const rem = Math.max(0,w.budget-spend); const p = pct(spend,w.budget); const count = wItems(w.id).length; const over = spend > w.budget;
              return (
                <div key={w.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 100px 60px 140px",padding:"14px 20px",background:idx%2===0?"#0d0d12":"#0a0a0c",borderBottom:"1px solid #111118",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:w.accent,flexShrink:0}} />
                    <div style={{fontSize:13,color:"#d0ccc4"}}>{w.name}</div>
                  </div>
                  <div style={{fontSize:13,color:"#666"}}>{fmt(w.budget)}</div>
                  <div style={{fontSize:13,color:w.accent}}>{fmt(spend)}</div>
                  <div style={{fontSize:13,color:over?"#c87878":"#888"}}>{over?`–${fmt(spend-w.budget)}`:fmt(rem)}</div>
                  <div style={{fontSize:13,color:"#444"}}>{count}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:3,background:"#151520",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${p}%`,background:over?"#c87878":w.accent,borderRadius:2}} />
                    </div>
                    <span style={{fontSize:10,color:"#333",width:30,textAlign:"right"}}>{p}%</span>
                  </div>
                </div>
              );
            })}
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 100px 60px 140px",padding:"14px 20px",background:"#0f0f16",borderTop:"1px solid #222"}}>
              <div style={{fontSize:10,color:"#c9a84c",letterSpacing:"0.12em",textTransform:"uppercase"}}>Total</div>
              <div style={{fontSize:13,color:"#c9a84c",fontWeight:700}}>{fmt(totalBudget)}</div>
              <div style={{fontSize:13,color:"#c9a84c",fontWeight:700}}>{fmt(totalSpend)}</div>
              <div style={{fontSize:13,color:"#c9a84c",fontWeight:700}}>{fmt(Math.max(0,totalBudget-totalSpend))}</div>
              <div style={{fontSize:13,color:"#c9a84c",fontWeight:700}}>{items.length}</div>
              <div />
            </div>
          </div>
          <div style={{fontSize:10,color:"#333",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>By Item Type</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:1,border:"1px solid #181820",borderRadius:6,overflow:"hidden"}}>
            {ITEM_TYPES.map(type => {
              const typeItems = items.filter((i: any) => i.type === type);
              const typeSpend = typeItems.reduce((s: number, i: any) => s + Number(i.price||0), 0);
              return (
                <div key={type} style={{padding:"18px 20px",background:"#0d0d12",borderRight:"1px solid #181820",borderBottom:"1px solid #181820"}}>
                  <div style={{fontSize:18,marginBottom:8}}>{typeIcon(type)}</div>
                  <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{type}</div>
                  <div style={{fontSize:17,color:"#e8e4dc"}}>{fmt(typeSpend)}</div>
                  <div style={{fontSize:10,color:"#333",marginTop:2}}>{typeItems.length} piece{typeItems.length!==1?"s":""}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════ CLOSET PAGE ══════════ */}
      {page === "closet" && (
        <div style={{maxWidth:1440,margin:"0 auto",padding:"28px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",marginBottom:32,border:"1px solid #181820",borderRadius:6,overflow:"hidden"}}>
            {[
              {label:"Collections", value:wardrobes.length},
              {label:"Total Pieces", value:items.length},
              {label:"Total Value", value:fmt(totalSpend), gold:true},
              {label:"Budget Left", value:fmt(Math.max(0,totalBudget-totalSpend))},
            ].map((s,i) => (
              <div key={s.label} style={{padding:"16px 22px",background:"#0d0d12",borderRight:i<3?"1px solid #181820":"none"}}>
                <div style={{fontSize:10,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5}}>{s.label}</div>
                <div style={{fontSize:21,color:(s as any).gold?"#c9a84c":"#e8e4dc"}}>{s.value}</div>
              </div>
            ))}
          </div>

          {!activeWardrobe && (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontSize:10,color:"#333",letterSpacing:"0.18em",textTransform:"uppercase"}}>
                  All Collections <span style={{color:"#222",marginLeft:6}}>{wardrobes.length}</span>
                </div>
                <button onClick={openNewCollectionModal}
                  style={{padding:"6px 14px",borderRadius:4,border:"1px dashed #2a2a38",background:"none",color:"#444",cursor:"pointer",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:13}}>+</span> New Collection
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:8}}>
                {wardrobes.map((w: any) => {
                  const spend = wSpend(w.id); const p = pct(spend,w.budget); const wi = wItems(w.id); const over = spend > w.budget;
                  return (
                    <div key={w.id}
                      style={{background:"#0d0d12",borderRadius:6,border:"1px solid #181820",overflow:"hidden",transition:"border-color 0.18s,transform 0.18s"}}
                      onMouseEnter={e => { (e.currentTarget as any).style.borderColor="#252535"; (e.currentTarget as any).style.transform="translateY(-1px)"; }}
                      onMouseLeave={e => { (e.currentTarget as any).style.borderColor="#181820"; (e.currentTarget as any).style.transform="translateY(0)"; }}>
                      <div style={{height:3,background:w.accent,opacity:0.65}} />
                      <div style={{padding:"18px 20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div style={{flex:1,minWidth:0,marginRight:8}}>
                            <div style={{fontSize:14,color:"#e8e4dc",marginBottom:3,lineHeight:1.3}}>{w.name}</div>
                            <div style={{fontSize:10,color:"#333"}}>{wi.length} piece{wi.length!==1?"s":""}</div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,marginRight:8}}>
                            <div style={{fontSize:15,color:w.accent}}>{fmt(spend)}</div>
                            {editingBudgetId === w.id ? (
                              <input autoFocus value={budgetDraft} onChange={(e: any) => setBudgetDraft(e.target.value)}
                                onBlur={() => { updateWardrobe(w.id,{budget:Number(budgetDraft)}); setEditingBudgetId(null); }}
                                onKeyDown={(e: any) => e.key==="Enter" && e.target.blur()}
                                style={{width:70,background:"none",border:"none",borderBottom:`1px solid ${w.accent}`,color:w.accent,fontSize:10,textAlign:"right",padding:"1px 2px",outline:"none"}} />
                            ) : (
                              <div onClick={() => { setEditingBudgetId(w.id); setBudgetDraft(String(w.budget)); }}
                                style={{fontSize:10,color:"#2a2a2a",cursor:"pointer",borderBottom:"1px dashed #222"}}>
                                {fmt(w.budget)} budget
                              </div>
                            )}
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={() => startEditCollection(w)}
                              style={{background:"none",border:"1px solid #252530",color:"#555",borderRadius:3,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✏</button>
                            <button onClick={() => setConfirmDelete(w)}
                              style={{background:"none",border:"1px solid #252530",color:"#c87878",borderRadius:3,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                          </div>
                        </div>
                        <div style={{marginBottom:12}}>
                          {editingDescription === w.id ? (
                            <div>
                              <textarea value={descDraft} onChange={(e: any) => setDescDraft(e.target.value)} rows={3}
                                style={{width:"100%",background:"#060610",border:"1px solid #c9a84c33",color:"#999",fontSize:11,borderRadius:4,padding:"7px 10px",resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"Georgia,serif",lineHeight:1.6}} />
                              <div style={{display:"flex",gap:6,marginTop:5}}>
                                <button onClick={() => saveDescription(w.id)} style={{padding:"4px 14px",borderRadius:3,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:10,fontWeight:700}}>Save</button>
                                <button onClick={() => setEditingDescription(null)} style={{padding:"4px 10px",borderRadius:3,border:"1px solid #222",background:"none",color:"#555",cursor:"pointer",fontSize:10}}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => { setEditingDescription(w.id); setDescDraft(w.description||""); }}
                              style={{fontSize:11,color:w.description?"#666":"#252530",lineHeight:1.65,cursor:"pointer",paddingLeft:10,borderLeft:`2px solid ${w.accent}22`,fontStyle:w.description?"normal":"italic",minHeight:18}}>
                              {w.description || "Add a description..."}
                            </div>
                          )}
                        </div>
                        <div style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontSize:10,color:"#2a2a2a"}}>{over?"Over budget":`${p}% used`}</span>
                            <span style={{fontSize:10,color:over?"#c87878":"#333"}}>{over?`+${fmt(spend-w.budget)}`:`${fmt(w.budget-spend)} left`}</span>
                          </div>
                          <div style={{height:3,background:"#151520",borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${p}%`,background:over?"#c87878":w.accent,transition:"width 0.4s"}} />
                          </div>
                        </div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14,minHeight:34}}>
                          {wi.slice(0,10).map((item: any) => (
                            <div key={item.id} style={{width:30,height:30,borderRadius:3,background:item.image?`url(${item.image}) center/cover`:"#181822",border:"1px solid #252530",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>
                              {!item.image && typeIcon(item.type)}
                            </div>
                          ))}
                          {wi.length > 10 && <div style={{width:30,height:30,borderRadius:3,background:"#181822",border:"1px solid #252530",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#444"}}>+{wi.length-10}</div>}
                          {wi.length === 0 && <div style={{fontSize:11,color:"#252530",fontStyle:"italic"}}>No pieces yet</div>}
                        </div>
                        <button onClick={() => { setActiveWardrobe(w.id); setFilterOccasion(null); setSearchQuery(""); }}
                          style={{width:"100%",padding:"8px 0",borderRadius:4,border:`1px solid ${w.accent}22`,background:`${w.accent}08`,color:w.accent,cursor:"pointer",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",transition:"background 0.15s"}}
                          onMouseEnter={e => (e.target as any).style.background=`${w.accent}16`}
                          onMouseLeave={e => (e.target as any).style.background=`${w.accent}08`}>
                          Open Collection →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeWardrobe && activeWD && (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16,flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:activeWD.accent}} />
                    <div style={{fontSize:19,color:"#e8e4dc"}}>{activeWD.name}</div>
                  </div>
                  <div style={{fontSize:11,color:"#3a3a3a"}}>
                    {wItems(activeWardrobe).length} pieces · {fmt(wSpend(activeWardrobe))} of {fmt(activeWD.budget)} ({pct(wSpend(activeWardrobe),activeWD.budget)}%)
                  </div>
                </div>
                <div style={{width:160}}>
                  <div style={{height:3,background:"#151520",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct(wSpend(activeWardrobe),activeWD.budget)}%`,background:pct(wSpend(activeWardrobe),activeWD.budget)>90?"#c87878":activeWD.accent}} />
                  </div>
                </div>
              </div>
              {activeWD.description && (
                <div style={{background:"#0d0d12",border:"1px solid #181820",borderLeft:`3px solid ${activeWD.accent}`,borderRadius:4,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#666",lineHeight:1.65,fontStyle:"italic"}}>
                  {activeWD.description}
                </div>
              )}
              <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
                <input value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} placeholder="Search pieces..."
                  style={{padding:"6px 12px",borderRadius:4,border:"1px solid #181820",background:"#0d0d12",color:"#e8e4dc",fontSize:11,width:150,outline:"none"}} />
                <div style={{width:1,height:16,background:"#181820"}} />
                {(tags.occasion || []).map((tag: string) => (
                  <button key={tag} onClick={() => setFilterOccasion(filterOccasion===tag?null:tag)}
                    style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${filterOccasion===tag?activeWD.accent+"55":"#181820"}`,background:filterOccasion===tag?activeWD.accent+"18":"none",color:filterOccasion===tag?activeWD.accent:"#3a3a3a",cursor:"pointer",fontSize:10}}>
                    {tag}
                  </button>
                ))}
                {(filterOccasion || searchQuery) && (
                  <button onClick={() => { setFilterOccasion(null); setSearchQuery(""); }} style={{padding:"5px 10px",borderRadius:4,border:"1px solid #c8787822",background:"none",color:"#c87878",cursor:"pointer",fontSize:10}}>
                    Clear ×
                  </button>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
                {filteredItems().map((item: any) => {
                  const picked = outfitPicks.find((i: any) => i.id === item.id);
                  return (
                    <div key={item.id} className="item-card"
                      style={{background:picked?"#131310":"#0d0d12",borderRadius:6,border:`1px solid ${picked?activeWD.accent+"55":"#181820"}`,cursor:outfitMode?"pointer":"default",overflow:"hidden",transition:"border-color 0.15s"}}
                      onClick={() => outfitMode && toggleOutfit(item)}>
                      <div style={{height:190,background:item.image?`url(${item.image}) center/cover no-repeat`:"#111118",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,position:"relative"}}>
                        {!item.image && typeIcon(item.type)}
                        {picked && <div style={{position:"absolute",top:8,right:8,width:22,height:22,borderRadius:"50%",background:activeWD.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#0a0a0c",fontWeight:700}}>✓</div>}
                        {!outfitMode && (
                          <div className="item-actions" style={{position:"absolute",top:8,right:8,display:"flex",gap:4,opacity:0,transition:"opacity 0.15s"}}>
                            <button onClick={(e: any) => { e.stopPropagation(); startEdit(item); }} style={{background:"#000000cc",border:"none",color:"#e8e4dc",borderRadius:3,padding:"5px 8px",cursor:"pointer",fontSize:11}}>✏</button>
                            <button onClick={(e: any) => { e.stopPropagation(); deleteItemById(item.id); }} style={{background:"#000000cc",border:"none",color:"#c87878",borderRadius:3,padding:"5px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                          </div>
                        )}
                        <div style={{position:"absolute",bottom:6,left:6,display:"flex",gap:3,flexWrap:"wrap",maxWidth:"90%"}}>
                          {(item.vibe||[]).slice(0,2).map((v: string) => <span key={v} style={{background:"#000000bb",color:"#777",borderRadius:2,padding:"2px 5px",fontSize:9}}>{v}</span>)}
                        </div>
                      </div>
                      <div style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                          <div style={{fontSize:12,color:"#e8e4dc",lineHeight:1.3,flex:1,marginRight:6}}>{item.name}</div>
                          <div style={{fontSize:13,color:activeWD.accent,flexShrink:0}}>${item.price}</div>
                        </div>
                        <div style={{fontSize:10,color:"#333",marginBottom:6}}>{(item.brand||[])[0]&&<>{item.brand[0]} · </>}{item.type}</div>
                        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
                          {(item.occasion||[]).slice(0,2).map((o: string) => <span key={o} style={{background:"#151520",color:"#3a3a3a",borderRadius:2,padding:"2px 6px",fontSize:9}}>{o}</span>)}
                          {(item.season||[]).slice(0,1).map((s: string) => <span key={s} style={{background:"#151520",color:"#3a3a3a",borderRadius:2,padding:"2px 6px",fontSize:9}}>{s}</span>)}
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()}
                            style={{display:"inline-block",marginTop:2,fontSize:10,color:activeWD.accent,textDecoration:"none",opacity:0.7}}>
                            View Product →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div onClick={() => { setNewItem({...BLANK_ITEM, wardrobe_id:activeWardrobe}); setShowAddItem(true); }}
                  style={{background:"#0a0a0e",borderRadius:6,border:"1px dashed #1e1e28",minHeight:290,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:8,transition:"border-color 0.15s"}}
                  onMouseEnter={e => (e.currentTarget as any).style.borderColor="#2a2a38"}
                  onMouseLeave={e => (e.currentTarget as any).style.borderColor="#1e1e28"}>
                  <div style={{width:36,height:36,border:"1px dashed #252530",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#252530",fontSize:20}}>+</div>
                  <div style={{fontSize:10,color:"#252530",letterSpacing:"0.14em",textTransform:"uppercase"}}>Add Piece</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ TAG MANAGER ════ */}
      {showTagManager && (
        <div style={S.modal}>
          <div style={{background:"#0d0d12",border:"1px solid #181820",borderRadius:8,width:"100%",maxWidth:660,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #181820",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0d0d12"}}>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#c9a84c"}}>Manage Tags</div>
              <button onClick={() => setShowTagManager(false)} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              <div style={{marginBottom:28,padding:"14px 16px",border:"1px dashed #222",borderRadius:6}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Add New Category</div>
                <div style={{display:"flex",gap:8}}>
                  <input value={newCategoryName} onChange={(e: any) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e: any) => e.key==="Enter" && addCategory()}
                    placeholder="e.g. Price Range, Care..."
                    style={{...S.input, flex:1}} />
                  <button onClick={addCategory}
                    style={{padding:"9px 16px",borderRadius:4,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                    + Add
                  </button>
                </div>
              </div>
              {Object.keys(tags).map(cat => (
                <TagSection key={cat} category={cat} label={TAG_LABELS[cat]||cat.replace(/_/g," ")}
                  tags={tags[cat]||[]} onAdd={(v: string) => addTag(cat,v)} onRemove={(v: string) => removeTag(cat,v)}
                  onRemoveCategory={() => removeCategory(cat)} isCustom={!DEFAULT_TAGS[cat]} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ COLLECTION MODAL ════ */}
      {showCollectionModal && (
        <div style={S.modal} onClick={(e: any) => e.target===e.currentTarget && setShowCollectionModal(false)}>
          <div style={{background:"#0d0d12",border:"1px solid #252535",borderRadius:8,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #181820",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#c9a84c"}}>
                {editingCollection ? "Edit Collection" : "New Collection"}
              </div>
              <button onClick={() => { setShowCollectionModal(false); setEditingCollection(null); setCollectionError(""); }}
                style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"22px 24px"}}>
              <div style={{marginBottom:16}}>
                <label style={S.label}>Collection Name *</label>
                <input autoFocus type="text" value={newCollection.name}
                  placeholder="e.g. Summer in Nantucket"
                  onChange={(e: any) => { setNewCollection((p: any) => ({...p, name:e.target.value})); setCollectionError(""); }}
                  onKeyDown={(e: any) => e.key==="Enter" && saveCollection()}
                  style={{...S.input, borderColor:collectionError&&!newCollection.name.trim()?"#c87878":"#252530"}} />
              </div>
              <div style={{marginBottom:16}}>
                <label style={S.label}>Budget ($)</label>
                <input type="number" value={newCollection.budget} placeholder="0"
                  onChange={(e: any) => setNewCollection((p: any) => ({...p, budget:e.target.value}))}
                  style={S.input} />
              </div>
              <div style={{marginBottom:16}}>
                <label style={S.label}>Description</label>
                <textarea value={newCollection.description}
                  onChange={(e: any) => setNewCollection((p: any) => ({...p, description:e.target.value}))}
                  rows={3} placeholder="Describe the vibe, occasions, style direction..."
                  style={{...S.input, resize:"none", lineHeight:1.6}} />
              </div>
              <div style={{marginBottom:24}}>
                <label style={S.label}>Accent Color</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {ACCENT_COLORS.map(c => (
                    <div key={c} onClick={() => setNewCollection((p: any) => ({...p, accent:c}))}
                      style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:newCollection.accent===c?"3px solid #e8e4dc":"3px solid transparent",boxSizing:"border-box",transition:"transform 0.1s",transform:newCollection.accent===c?"scale(1.15)":"scale(1)"}} />
                  ))}
                </div>
              </div>
              {collectionError && (
                <div style={{fontSize:12,color:"#c87878",marginBottom:14,padding:"9px 12px",background:"#c8787810",border:"1px solid #c8787825",borderRadius:4}}>
                  {collectionError}
                </div>
              )}
              <button onClick={saveCollection} disabled={savingCollection}
                style={{width:"100%",padding:"12px 0",borderRadius:4,border:"none",background:savingCollection?"#7a6428":"#c9a84c",color:"#0a0a0c",cursor:savingCollection?"not-allowed":"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase"}}>
                {savingCollection ? "Saving..." : (editingCollection ? "Save Changes" : "Create Collection")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRM ════ */}
      {confirmDelete && (
        <div style={{...S.modal, zIndex:300}} onClick={(e: any) => e.target===e.currentTarget && setConfirmDelete(null)}>
          <div style={{background:"#0d0d12",border:"1px solid #c8787825",borderRadius:8,width:"100%",maxWidth:380,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
            <div style={{fontSize:14,color:"#e8e4dc",marginBottom:8}}>Delete "{confirmDelete.name}"?</div>
            <div style={{fontSize:12,color:"#666",marginBottom:24,lineHeight:1.6}}>
              This will permanently delete the collection and all {wItems(confirmDelete.id).length} piece{wItems(confirmDelete.id).length!==1?"s":""} inside it.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={() => { deleteWardrobe(confirmDelete.id); setConfirmDelete(null); }}
                style={{flex:1,padding:"10px 0",borderRadius:4,border:"none",background:"#c87878",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Delete</button>
              <button onClick={() => setConfirmDelete(null)}
                style={{flex:1,padding:"10px 0",borderRadius:4,border:"1px solid #252530",background:"none",color:"#666",cursor:"pointer",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ ADD / EDIT ITEM ════ */}
      {showAddItem && (
        <div style={S.modal} onClick={(e: any) => e.target===e.currentTarget && resetForm()}>
          <div style={{background:"#0d0d12",border:"1px solid #181820",borderRadius:8,width:"100%",maxWidth:600,maxHeight:"94vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid #181820",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#0d0d12",zIndex:1}}>
              <div style={{fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"#c9a84c"}}>{editingItem?"Edit Piece":"Add New Piece"}</div>
              <button onClick={resetForm} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              <div style={{marginBottom:16}}>
                <label style={S.label}>Product Link (Auto-Fill)</label>
                <div style={{display:"flex",gap:8}}>
                  <input value={newItem.url} onChange={(e: any) => setNewItem((p: any) => ({...p, url:e.target.value}))}
                    onKeyDown={(e: any) => e.key==="Enter" && fetchFromUrl(newItem.url)}
                    placeholder="Paste a product URL..." style={{...S.input, flex:1}} />
                  <button onClick={() => fetchFromUrl(newItem.url)} disabled={fetchingUrl}
                    style={{padding:"9px 14px",borderRadius:4,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",opacity:fetchingUrl?0.6:1,whiteSpace:"nowrap"}}>
                    {fetchingUrl ? "..." : "Auto-Fill"}
                  </button>
                </div>
                {urlError && <div style={{fontSize:11,color:"#c87878",marginTop:6,lineHeight:1.5}}>{urlError}</div>}
              </div>
              <div style={{marginBottom:18}}>
                <label style={S.label}>Image</label>
                {newItem.image && (
                  <div style={{position:"relative",marginBottom:10}}>
                    <img src={newItem.image} alt="" onError={(e: any) => e.target.style.display="none"}
                      style={{width:"100%",height:150,objectFit:"contain",borderRadius:4,background:"#060610",border:"1px solid #181820"}} />
                    <button onClick={() => setNewItem((p: any) => ({...p, image:""}))}
                      style={{position:"absolute",top:8,right:8,background:"#000000cc",border:"none",color:"#c87878",borderRadius:3,padding:"3px 8px",cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:"#333",marginBottom:5}}>Paste image URL</div>
                    <input value={newItem.image?.startsWith("data:")?"":(newItem.image||"")}
                      onChange={(e: any) => setNewItem((p: any) => ({...p, image:e.target.value}))}
                      placeholder="https://..." style={{...S.input, fontSize:11}} />
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"#333",marginBottom:5}}>Upload from computer</div>
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}} />
                    <button onClick={() => imageInputRef.current?.click()}
                      style={{width:"100%",padding:"9px 12px",borderRadius:4,border:"1px dashed #252530",background:"none",color:"#666",cursor:"pointer",fontSize:11,textAlign:"center"}}>
                      📁 Choose File
                    </button>
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={S.label}>Item Name</label>
                  <input value={newItem.name} placeholder="e.g. Merino Crewneck" onChange={(e: any) => setNewItem((p: any) => ({...p, name:e.target.value}))} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Price ($)</label>
                  <input type="number" value={newItem.price} placeholder="0" onChange={(e: any) => setNewItem((p: any) => ({...p, price:e.target.value}))} style={S.input} />
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                <div>
                  <label style={S.label}>Type</label>
                  <select value={newItem.type} onChange={(e: any) => setNewItem((p: any) => ({...p, type:e.target.value}))}
                    style={{...S.input, padding:"9px 10px"}}>
                    {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Collection</label>
                  <select value={newItem.wardrobe_id||activeWardrobe||wardrobes[0]?.id}
                    onChange={(e: any) => setNewItem((p: any) => ({...p, wardrobe_id:Number(e.target.value)}))}
                    style={{...S.input, padding:"9px 10px"}}>
                    {wardrobes.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              {Object.keys(tags).map(key => (
                <div key={key} style={{marginBottom:16}}>
                  <label style={S.label}>{TAG_LABELS[key]||key.replace(/_/g," ")}</label>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {(tags[key]||[]).map((tag: string) => {
                      const on = (newItem[key]||[]).includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTag(key,tag)}
                          style={{padding:"4px 9px",borderRadius:3,border:`1px solid ${on?"#c9a84c55":"#1e1e28"}`,background:on?"#c9a84c12":"none",color:on?"#c9a84c":"#3a3a3a",cursor:"pointer",fontSize:11}}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={saveItem}
                style={{width:"100%",padding:"12px 0",borderRadius:4,border:"none",background:"#c9a84c",color:"#0a0a0c",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginTop:8}}>
                {editingItem ? "Save Changes" : "Add to Wardrobe"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .item-card:hover .item-actions { opacity: 1 !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252530; border-radius: 2px; }
      `}</style>
    </div>
  );
}

function TagSection({ category, label, tags, onAdd, onRemove, onRemoveCategory, isCustom }: any) {
  const [newTag, setNewTag] = useState("");
  return (
    <div style={{marginBottom:24,paddingBottom:24,borderBottom:"1px solid #111118"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:10,color:"#c9a84c",letterSpacing:"0.14em",textTransform:"uppercase"}}>{label}</div>
        {isCustom && (
          <button onClick={onRemoveCategory} style={{background:"none",border:"1px solid #252530",color:"#c87878",borderRadius:3,padding:"2px 8px",cursor:"pointer",fontSize:10}}>Remove</button>
        )}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {tags.map((tag: string) => (
          <div key={tag} style={{display:"flex",alignItems:"center",gap:4,background:"#151520",border:"1px solid #252530",borderRadius:3,padding:"3px 4px 3px 9px"}}>
            <span style={{fontSize:11,color:"#888"}}>{tag}</span>
            <button onClick={() => onRemove(tag)} style={{background:"none",border:"none",color:"#c87878",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}}>×</button>
          </div>
        ))}
        {tags.length === 0 && <div style={{fontSize:11,color:"#333",fontStyle:"italic"}}>No tags yet</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={newTag} onChange={(e: any) => setNewTag(e.target.value)}
          onKeyDown={(e: any) => { if (e.key==="Enter"&&newTag.trim()) { onAdd(newTag.trim()); setNewTag(""); } }}
          placeholder={`Add ${label.toLowerCase()} tag...`}
          style={{flex:1,padding:"7px 10px",borderRadius:4,border:"1px solid #1e1e28",background:"#060610",color:"#e8e4dc",fontSize:12,outline:"none",fontFamily:"Georgia,serif"}} />
        <button onClick={() => { if (newTag.trim()) { onAdd(newTag.trim()); setNewTag(""); } }}
          style={{padding:"7px 14px",borderRadius:4,border:"none",background:"#1e1e2a",color:"#c9a84c",cursor:"pointer",fontSize:11,fontWeight:700}}>
          + Add
        </button>
      </div>
    </div>
  );
}

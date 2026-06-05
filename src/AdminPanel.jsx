import React, { useState, useEffect, useRef } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => "$\u00a0" + Number(n).toLocaleString("es-CL");
const ADMIN_PIN = "123456";

const STORAGE_KEYS = {
  overrides: "kiosk_product_overrides",
  options:   "kiosk_option_overrides",
  promos:    "kiosk_promos",
  orders:    "kiosk_orders",
};

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PinScreen({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const press = (d) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 6) {
      if (next === ADMIN_PIN) { setTimeout(onSuccess, 200); }
      else { setTimeout(() => { setPin(""); setError(true); }, 400); }
    }
  };

  const del = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,15,8,0.92)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#faf8f4", borderRadius:28, padding:"40px 36px", width:320, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize:28, marginBottom:8 }}>🔐</div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"#1a1208", marginBottom:4 }}>Panel Administrador</div>
        <div style={{ fontSize:12, color:"#aaa", marginBottom:28 }}>Ingresa tu PIN de 6 dígitos</div>

        {/* PIN dots */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:24 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              width:16, height:16, borderRadius:"50%",
              background: pin.length > i ? (error ? "#e05a4a" : "#3d2b1f") : "#e8e0d4",
              transition:"all 0.15s",
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
            <button key={i} onClick={() => d === "⌫" ? del() : d !== "" ? press(String(d)) : null}
              style={{
                height:56, borderRadius:14, border:"none", fontSize: d === "⌫" ? 20 : 22, fontWeight:600,
                background: d === "" ? "transparent" : d === "⌫" ? "#f0ebe3" : "#fff",
                color:"#1a1208", cursor: d === "" ? "default" : "pointer",
                boxShadow: d !== "" && d !== "⌫" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition:"all 0.1s",
              }}>
              {d}
            </button>
          ))}
        </div>

        <button onClick={onCancel} style={{ background:"none", border:"none", color:"#aaa", fontSize:13, cursor:"pointer", padding:8 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab() {
  const orders = loadJSON(STORAGE_KEYS.orders, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.ts).toDateString() === today);

  const totalVentas = todayOrders.reduce((s, o) => s + o.total, 0);
  const totalPedidos = todayOrders.length;

  // Product ranking
  const prodCount = {};
  todayOrders.forEach(o => {
    o.items.forEach(it => {
      prodCount[it.nombre] = (prodCount[it.nombre] || 0) + it.cantidad;
    });
  });
  const ranking = Object.entries(prodCount).sort((a,b) => b[1]-a[1]).slice(0, 8);

  // Revenue by hour
  const hourly = {};
  todayOrders.forEach(o => {
    const h = new Date(o.ts).getHours();
    hourly[h] = (hourly[h] || 0) + o.total;
  });
  const hours = Array.from({length:14}, (_,i) => i+8); // 8am-9pm
  const maxHour = Math.max(...hours.map(h => hourly[h] || 0), 1);

  const clearOrders = () => {
    if (confirm("¿Borrar todo el historial de pedidos?")) {
      localStorage.removeItem(STORAGE_KEYS.orders);
      window.location.reload();
    }
  };

  return (
    <div style={{ padding:"24px 28px", overflowY:"auto", flex:1 }}>
      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
        {[
          { label:"Ventas Hoy", value: fmt(totalVentas), icon:"💰", color:"#e8c99a" },
          { label:"Pedidos Hoy", value: totalPedidos, icon:"🧾", color:"#a8d8a8" },
          { label:"Ticket Promedio", value: totalPedidos ? fmt(Math.round(totalVentas/totalPedidos)) : "$\u00a00", icon:"📊", color:"#a8c8e8" },
        ].map((k,i) => (
          <div key={i} style={{ background:"#fff", borderRadius:18, padding:"20px 22px", border:"1px solid #e8e0d4", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{k.icon}</div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:"#1a1208" }}>{k.value}</div>
            <div style={{ fontSize:12, color:"#aaa", marginTop:4, textTransform:"uppercase", letterSpacing:1 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Top productos */}
        <div style={{ background:"#fff", borderRadius:18, padding:"20px 22px", border:"1px solid #e8e0d4" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#1a1208", marginBottom:16 }}>🏆 Más pedidos hoy</div>
          {ranking.length === 0
            ? <div style={{ color:"#ccc", fontSize:13 }}>Sin pedidos aún</div>
            : ranking.map(([name, count], i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background: i===0?"#e8c99a":i===1?"#d4d4d4":i===2?"#d4a070":"#f0ebe3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#1a1208", flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1, fontSize:13, color:"#1a1208", fontWeight:500 }}>{name}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#8a5c30", background:"#faf6f0", padding:"3px 10px", borderRadius:20 }}>{count}x</div>
              </div>
            ))
          }
        </div>

        {/* Gráfico por hora */}
        <div style={{ background:"#fff", borderRadius:18, padding:"20px 22px", border:"1px solid #e8e0d4" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#1a1208", marginBottom:16 }}>📈 Ventas por hora</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120 }}>
            {hours.map(h => {
              const val = hourly[h] || 0;
              const pct = val / maxHour;
              return (
                <div key={h} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <div style={{ width:"100%", height: Math.max(4, pct*100), background: val>0?"linear-gradient(to top,#3d2b1f,#6b4c35)":"#f0ebe3", borderRadius:"4px 4px 0 0", transition:"height 0.3s" }} title={fmt(val)} />
                  <div style={{ fontSize:8, color:"#ccc", transform:"rotate(-45deg)", transformOrigin:"center", whiteSpace:"nowrap" }}>{h}h</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historial reciente */}
      <div style={{ background:"#fff", borderRadius:18, padding:"20px 22px", border:"1px solid #e8e0d4", marginTop:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#1a1208" }}>📋 Últimos pedidos</div>
          <button onClick={clearOrders} style={{ fontSize:11, color:"#e05a4a", background:"none", border:"1px solid #e05a4a", borderRadius:8, padding:"4px 12px", cursor:"pointer" }}>Borrar historial</button>
        </div>
        {todayOrders.length === 0
          ? <div style={{ color:"#ccc", fontSize:13 }}>Sin pedidos hoy</div>
          : [...todayOrders].reverse().slice(0,10).map((o, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #f0ebe3" }}>
              <div>
                <div style={{ fontSize:12, color:"#aaa" }}>{new Date(o.ts).toLocaleTimeString("es-CL", {hour:"2-digit",minute:"2-digit"})}</div>
                <div style={{ fontSize:12, color:"#7a6552", marginTop:2 }}>{o.items.map(it=>`${it.cantidad}× ${it.nombre}`).join(", ")}</div>
              </div>
              <div style={{ fontWeight:700, color:"#8a5c30", fontSize:14, whiteSpace:"nowrap" }}>{fmt(o.total)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab({ menu, setMenu }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // product being edited
  const [catFilter, setCatFilter] = useState("Todos");
  const fileRef = useRef();

  const cats = ["Todos", ...new Set(menu.map(p => p.cat))];
  const filtered = menu.filter(p =>
    (catFilter === "Todos" || p.cat === catFilter) &&
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const updateProduct = (id, changes) => {
    const updated = menu.map(p => p.id === id ? {...p, ...changes} : p);
    setMenu(updated);
    // Save img separately to avoid localStorage quota issues with base64
    if ("img" in changes) {
      try {
        if (changes.img) localStorage.setItem("kiosk_img_" + id, changes.img);
        else localStorage.removeItem("kiosk_img_" + id);
      } catch(e) { alert("Imagen demasiado grande para guardar. Usa una URL en su lugar."); }
    }
    // Save rest of changes (excluding img) in overrides
    const { img, ...changesNoImg } = changes;
    const overrides = loadJSON(STORAGE_KEYS.overrides, {});
    overrides[id] = {...(overrides[id]||{}), ...changesNoImg};
    try { saveJSON(STORAGE_KEYS.overrides, overrides); }
    catch(e) { console.error("Save error:", e); }
  };

  const deleteProduct = (id) => {
    if (!confirm("¿Eliminar este producto del menú?")) return;
    const updated = menu.filter(p => p.id !== id);
    setMenu(updated);
    const overrides = loadJSON(STORAGE_KEYS.overrides, {});
    overrides[id] = {...(overrides[id]||{}), _deleted: true};
    saveJSON(STORAGE_KEYS.overrides, overrides);
    setEditing(null);
    alert("✓ Producto eliminado");
  };

  const addProduct = () => {
    const newId = Date.now();
    const newP = { id:newId, cat:"Café", nombre:"Nuevo Producto", desc:"", precio:3000, img:null, active:true, _custom:true };
    const updated = [...menu, newP];
    setMenu(updated);
    const overrides = loadJSON(STORAGE_KEYS.overrides, {});
    overrides[newId] = newP;
    saveJSON(STORAGE_KEYS.overrides, overrides);
    setEditing(newP);
  };

  const handleImg = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // Resize to max 400x400 to reduce storage size
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const ratio = Math.min(MAX/img.width, MAX/img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        updateProduct(id, { img: compressed });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const reorder = (id, dir) => {
    const idx = menu.findIndex(p => p.id === id);
    if (idx < 0) return;
    const next = [...menu];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setMenu(next);
    saveJSON("kiosk_order", next.map(p => p.id));
    alert("✓ Orden guardado");
  };

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      {/* List */}
      <div style={{ width: editing ? 340 : "100%", borderRight: editing ? "1px solid #e8e0d4" : "none", display:"flex", flexDirection:"column", transition:"width 0.2s" }}>
        {/* Toolbar */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #e8e0d4", display:"flex", gap:10, alignItems:"center" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar producto..." style={{ flex:1, border:"1px solid #e8e0d4", borderRadius:10, padding:"8px 14px", fontSize:13, outline:"none", background:"#faf8f4" }} />
          <button onClick={addProduct} style={{ background:"#3d2b1f", border:"none", color:"#e8c99a", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>+ Agregar</button>
        </div>
        {/* Cat filter */}
        <div style={{ display:"flex", overflowX:"auto", gap:0, borderBottom:"1px solid #e8e0d4", scrollbarWidth:"none" }}>
          {cats.map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} style={{ background:"none", border:"none", borderBottom: c===catFilter?"2px solid #3d2b1f":"2px solid transparent", padding:"9px 14px", fontSize:12, color: c===catFilter?"#3d2b1f":"#aaa", fontWeight: c===catFilter?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>{c}</button>
          ))}
        </div>
        {/* Product list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map(p => (
            <div key={p.id} onClick={()=>setEditing(p)} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 20px",
              borderBottom:"1px solid #f5f0e8", cursor:"pointer",
              background: editing?.id===p.id ? "#faf6f0" : "transparent",
              opacity: p.active===false ? 0.45 : 1,
              transition:"background 0.1s",
            }}>
              <div style={{ width:48, height:48, borderRadius:12, overflow:"hidden", background:"#f5f0e8", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {p.img ? <img src={p.img} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:22 }}>🍽</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600, color:"#1a1208", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.nombre}</div>
                <div style={{ fontSize:12, color:"#8a5c30", marginTop:2 }}>{fmt(p.precio)}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                <button onClick={e=>{e.stopPropagation();reorder(p.id,-1)}} style={{ background:"#f0ebe3", border:"none", borderRadius:5, width:22, height:22, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>↑</button>
                <button onClick={e=>{e.stopPropagation();reorder(p.id,1)}} style={{ background:"#f0ebe3", border:"none", borderRadius:5, width:22, height:22, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>↓</button>
              </div>
              <div style={{ width:10, height:10, borderRadius:"50%", background: p.active===false?"#e8e0d4":"#6bcb77", flexShrink:0 }} title={p.active===false?"Inactivo":"Activo"} />
            </div>
          ))}
        </div>
      </div>

      {/* Editor panel */}
      {editing && (() => {
        const p = menu.find(x => x.id === editing.id) || editing;
        return (
          <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#1a1208" }}>Editar Producto</div>
              <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#aaa" }}>✕</button>
            </div>

            {/* Image */}
            <div style={{ marginBottom:20, textAlign:"center" }}>
              <div style={{ width:120, height:120, borderRadius:20, overflow:"hidden", background:"#f5f0e8", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", border:"2px dashed #e8d8c8" }}>
                {p.img ? <img src={p.img} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:44 }}>🍽</span>}
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                <button onClick={()=>fileRef.current?.click()} style={{ fontSize:12, background:"#f0ebe3", border:"1px solid #e8d8c8", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:"#3d2b1f", fontWeight:600 }}>📁 Subir imagen</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImg(p.id,e)} />
                <button onClick={()=>{
                  const url = prompt("URL de imagen:");
                  if(url) updateProduct(p.id,{img:url});
                }} style={{ fontSize:12, background:"#f0ebe3", border:"1px solid #e8d8c8", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:"#3d2b1f", fontWeight:600 }}>🔗 URL</button>
                {p.img && <button onClick={()=>updateProduct(p.id,{img:null})} style={{ fontSize:12, background:"none", border:"1px solid #e8d8c8", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:"#e05a4a" }}>✕ Quitar</button>}
              </div>
            </div>

            {/* Fields */}
            {[
              { label:"Nombre", key:"nombre", type:"text" },
              { label:"Descripción", key:"desc", type:"textarea" },
              { label:"Precio (CLP)", key:"precio", type:"number" },
              { label:"Categoría", key:"cat", type:"select", opts:["Café","Kafe Frío","Chocolate","Non Kafe","Té","Helados","Repostería","Salados"] },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#7a6552", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{f.label}</label>
                {f.type==="textarea"
                  ? <textarea value={p[f.key]||""} onChange={e=>updateProduct(p.id,{[f.key]:e.target.value})} rows={3} style={{ width:"100%", border:"1px solid #e8d8c8", borderRadius:10, padding:"9px 13px", fontSize:13, outline:"none", resize:"vertical", fontFamily:"inherit", background:"#faf8f4", boxSizing:"border-box" }} />
                  : f.type==="select"
                  ? <select value={p[f.key]||""} onChange={e=>updateProduct(p.id,{[f.key]:e.target.value})} style={{ width:"100%", border:"1px solid #e8d8c8", borderRadius:10, padding:"9px 13px", fontSize:13, outline:"none", background:"#faf8f4" }}>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : <input type={f.type} value={p[f.key]||""} onChange={e=>updateProduct(p.id,{[f.key]: f.type==="number"?Number(e.target.value):e.target.value})} style={{ width:"100%", border:"1px solid #e8d8c8", borderRadius:10, padding:"9px 13px", fontSize:13, outline:"none", background:"#faf8f4", boxSizing:"border-box" }} />
                }
              </div>
            ))}

            {/* Active toggle */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#faf8f4", borderRadius:14, border:"1px solid #e8e0d4", marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, color:"#1a1208" }}>Producto activo</div>
                <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>Si está inactivo no aparece en el tótem</div>
              </div>
              <div onClick={()=>updateProduct(p.id,{active: p.active===false ? true : false})} style={{
                width:48, height:26, borderRadius:13, background: p.active===false?"#e8e0d4":"#3d2b1f", position:"relative", cursor:"pointer", transition:"background 0.2s",
              }}>
                <div style={{ position:"absolute", top:3, left: p.active===false?3:25, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setEditing(null)} style={{ flex:1, background:"#f0ebe3", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", color:"#3d2b1f" }}>Cerrar</button>
              <button onClick={()=>deleteProduct(p.id)} style={{ background:"#fff", border:"1px solid #e05a4a", borderRadius:12, padding:"13px 18px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#e05a4a" }}>🗑 Eliminar</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Options Tab ───────────────────────────────────────────────────────────────
function OptionsTab({ menu, productOptions, setProductOptions }) {
  const [selProd, setSelProd] = useState(null);
  const [opts, setOpts] = useState({});

  const productsWithOptions = menu.filter(p => productOptions[p.id]);

  useEffect(() => {
    if (selProd) setOpts(JSON.parse(JSON.stringify(productOptions[selProd] || [])));
  }, [selProd]);

  const save = () => {
    const updated = {...productOptions, [selProd]: opts};
    setProductOptions(updated);
    saveJSON(STORAGE_KEYS.options, updated);
    alert("✓ Opciones guardadas");
  };

  const addGroup = () => setOpts(prev => [...(Array.isArray(prev)?prev:[]), {label:"Nueva opción", options:[{name:"Opción 1",extra:0}]}]);
  const removeGroup = (gi) => setOpts(prev => prev.filter((_,i)=>i!==gi));
  const addOption = (gi) => setOpts(prev => prev.map((g,i) => i===gi ? {...g, options:[...g.options,{name:"Nueva variante",extra:0}]} : g));
  const removeOption = (gi,oi) => setOpts(prev => prev.map((g,i) => i===gi ? {...g, options:g.options.filter((_,j)=>j!==oi)} : g));
  const updateGroup = (gi,key,val) => setOpts(prev => prev.map((g,i) => i===gi ? {...g,[key]:val} : g));
  const updateOption = (gi,oi,key,val) => setOpts(prev => prev.map((g,i) => i===gi ? {...g, options:g.options.map((o,j)=>j===oi?{...o,[key]:val}:o)} : g));

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      {/* Product list */}
      <div style={{ width:220, borderRight:"1px solid #e8e0d4", overflowY:"auto" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #e8e0d4", fontSize:12, color:"#aaa", fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Productos con opciones</div>
        {productsWithOptions.map(p => (
          <div key={p.id} onClick={()=>setSelProd(p.id)} style={{ padding:"11px 16px", cursor:"pointer", background: selProd===p.id?"#faf6f0":"transparent", borderBottom:"1px solid #f5f0e8", fontSize:13, fontWeight: selProd===p.id?700:400, color:"#1a1208" }}>
            {p.nombre}
          </div>
        ))}
      </div>

      {/* Options editor */}
      {selProd ? (
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"#1a1208" }}>
              {menu.find(p=>p.id===selProd)?.nombre}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={addGroup} style={{ fontSize:12, background:"#f0ebe3", border:"1px solid #e8d8c8", borderRadius:9, padding:"7px 14px", cursor:"pointer", color:"#3d2b1f", fontWeight:600 }}>+ Grupo</button>
              <button onClick={save} style={{ fontSize:12, background:"#3d2b1f", border:"none", borderRadius:9, padding:"7px 16px", cursor:"pointer", color:"#e8c99a", fontWeight:700 }}>Guardar</button>
            </div>
          </div>

          {(Array.isArray(opts)?opts:[]).map((g,gi) => (
            <div key={gi} style={{ background:"#fff", borderRadius:16, border:"1px solid #e8e0d4", padding:"18px 20px", marginBottom:14 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14 }}>
                <input value={g.label} onChange={e=>updateGroup(gi,"label",e.target.value)} style={{ flex:1, border:"1px solid #e8d8c8", borderRadius:9, padding:"7px 12px", fontSize:14, fontWeight:700, outline:"none", background:"#faf8f4" }} placeholder="Nombre del grupo" />
                <button onClick={()=>removeGroup(gi)} style={{ background:"none", border:"1px solid #e8d8c8", borderRadius:8, padding:"6px 12px", cursor:"pointer", color:"#e05a4a", fontSize:13 }}>🗑</button>
              </div>
              {g.options.map((o,oi) => (
                <div key={oi} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                  <input value={o.name} onChange={e=>updateOption(gi,oi,"name",e.target.value)} style={{ flex:2, border:"1px solid #e8d8c8", borderRadius:9, padding:"7px 11px", fontSize:13, outline:"none", background:"#faf8f4" }} placeholder="Nombre variante" />
                  <div style={{ display:"flex", alignItems:"center", gap:4, background:"#faf8f4", border:"1px solid #e8d8c8", borderRadius:9, padding:"4px 10px" }}>
                    <span style={{ fontSize:11, color:"#aaa" }}>+$</span>
                    <input type="number" value={o.extra} onChange={e=>updateOption(gi,oi,"extra",Number(e.target.value))} style={{ width:70, border:"none", fontSize:13, outline:"none", background:"transparent" }} min={0} />
                  </div>
                  <button onClick={()=>removeOption(gi,oi)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:16, padding:"4px" }}>✕</button>
                </div>
              ))}
              <button onClick={()=>addOption(gi)} style={{ fontSize:12, background:"none", border:"1px dashed #e8d8c8", borderRadius:9, padding:"6px 14px", cursor:"pointer", color:"#aaa", width:"100%", marginTop:4 }}>+ Agregar variante</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#ccc", fontSize:14 }}>
          Selecciona un producto para editar sus opciones
        </div>
      )}
    </div>
  );
}

// ── Promos Tab ────────────────────────────────────────────────────────────────
function PromosTab({ menu }) {
  const [promos, setPromos] = useState(() => loadJSON(STORAGE_KEYS.promos, []));
  const [editing, setEditing] = useState(null);

  const save = (promo) => {
    const updated = promo.id
      ? promos.map(p => p.id===promo.id ? promo : p)
      : [...promos, {...promo, id:Date.now()}];
    setPromos(updated);
    saveJSON(STORAGE_KEYS.promos, updated);
    setEditing(null);
  };

  const del = (id) => {
    const updated = promos.filter(p=>p.id!==id);
    setPromos(updated);
    saveJSON(STORAGE_KEYS.promos, updated);
  };

  const newPromo = { nombre:"", desc:"", precio:0, productos:[], activo:true };

  return (
    <div style={{ padding:"24px 28px", overflowY:"auto", flex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#1a1208" }}>Packs & Promociones</div>
        <button onClick={()=>setEditing({...newPromo})} style={{ background:"#3d2b1f", border:"none", color:"#e8c99a", borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Nuevo pack</button>
      </div>

      {promos.length === 0 && !editing && (
        <div style={{ textAlign:"center", color:"#ccc", padding:"60px 0" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎁</div>
          <div>Sin promociones aún. Crea tu primer pack.</div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:24 }}>
        {promos.map(promo => (
          <div key={promo.id} style={{ background:"#fff", borderRadius:18, border:"1px solid #e8e0d4", padding:"20px 22px", opacity:promo.activo?1:0.5 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#1a1208" }}>{promo.nombre || "Sin nombre"}</div>
                <div style={{ fontSize:12, color:"#aaa", marginTop:3 }}>{promo.desc}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setEditing({...promo})} style={{ background:"#f0ebe3", border:"none", borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:13 }}>✏️</button>
                <button onClick={()=>del(promo.id)} style={{ background:"none", border:"1px solid #e8d8c8", borderRadius:8, padding:"5px 10px", cursor:"pointer", color:"#e05a4a", fontSize:13 }}>🗑</button>
              </div>
            </div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:"#8a5c30", marginBottom:8 }}>{fmt(promo.precio)}</div>
            {promo.productos?.length > 0 && (
              <div style={{ fontSize:11, color:"#7a6552" }}>
                Incluye: {promo.productos.map(id => menu.find(p=>p.id===id)?.nombre || id).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor modal */}
      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(26,15,8,0.5)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#faf8f4", borderRadius:24, padding:"32px 36px", width:440, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#1a1208", marginBottom:22 }}>
              {editing.id ? "Editar pack" : "Nuevo pack"}
            </div>

            {[
              {label:"Nombre del pack", key:"nombre", type:"text"},
              {label:"Descripción", key:"desc", type:"textarea"},
              {label:"Precio del pack (CLP)", key:"precio", type:"number"},
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#7a6552", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{f.label}</label>
                {f.type==="textarea"
                  ? <textarea value={editing[f.key]||""} onChange={e=>setEditing(prev=>({...prev,[f.key]:e.target.value}))} rows={2} style={{ width:"100%", border:"1px solid #e8d8c8", borderRadius:10, padding:"9px 13px", fontSize:13, outline:"none", resize:"vertical", fontFamily:"inherit", background:"#fff", boxSizing:"border-box" }} />
                  : <input type={f.type} value={editing[f.key]||""} onChange={e=>setEditing(prev=>({...prev,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))} style={{ width:"100%", border:"1px solid #e8d8c8", borderRadius:10, padding:"9px 13px", fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box" }} />
                }
              </div>
            ))}

            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#7a6552", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Productos incluidos</label>
              <div style={{ maxHeight:180, overflowY:"auto", border:"1px solid #e8d8c8", borderRadius:10, background:"#fff" }}>
                {menu.filter(p=>p.active!==false).map(p => {
                  const checked = editing.productos?.includes(p.id);
                  return (
                    <label key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 13px", cursor:"pointer", borderBottom:"1px solid #f5f0e8" }}>
                      <input type="checkbox" checked={!!checked} onChange={e=>setEditing(prev=>({...prev, productos: e.target.checked ? [...(prev.productos||[]),p.id] : (prev.productos||[]).filter(id=>id!==p.id)}))} />
                      <span style={{ fontSize:13, color:"#1a1208" }}>{p.nombre}</span>
                      <span style={{ fontSize:12, color:"#8a5c30", marginLeft:"auto" }}>{fmt(p.precio)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setEditing(null)} style={{ flex:1, background:"#f0ebe3", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", color:"#3d2b1f" }}>Cancelar</button>
              <button onClick={()=>save(editing)} style={{ flex:2, background:"#3d2b1f", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer", color:"#e8c99a" }}>Guardar pack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
export default function AdminPanel({ onClose, menu, setMenu, productOptions, setProductOptions }) {
  const [tab, setTab] = useState("stats");

  const tabs = [
    { id:"stats",    label:"📊 Estadísticas" },
    { id:"products", label:"🍽 Productos" },
    { id:"options",  label:"⚙️ Opciones" },
    { id:"promos",   label:"🎁 Promociones" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000, background:"#faf8f4", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <header style={{ background:"#1a0f08", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ color:"#e8c99a", fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, letterSpacing:1 }}>KIOSK·IQ — Admin</div>
          <div style={{ display:"flex", gap:0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ background: t.id===tab?"rgba(232,201,154,0.15)":"transparent", border:"none", color: t.id===tab?"#e8c99a":"rgba(255,255,255,0.5)", padding:"8px 16px", fontSize:13, cursor:"pointer", borderRadius:8, fontWeight: t.id===tab?700:400, transition:"all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:10, padding:"8px 18px", fontSize:13, cursor:"pointer", fontWeight:600 }}>
          ✕ Cerrar admin
        </button>
      </header>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex" }}>
        {tab==="stats"    && <StatsTab />}
        {tab==="products" && <ProductsTab menu={menu} setMenu={setMenu} />}
        {tab==="options"  && <OptionsTab menu={menu} productOptions={productOptions} setProductOptions={setProductOptions} />}
        {tab==="promos"   && <PromosTab menu={menu} />}
      </div>
    </div>
  );
}

export { PinScreen, STORAGE_KEYS, loadJSON, saveJSON };

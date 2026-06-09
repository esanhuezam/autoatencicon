import React, { useState, useEffect } from "react";
import AdminPanel, { PinScreen, STORAGE_KEYS, loadJSON, saveJSON } from "./AdminPanel.jsx";
import { LOGO, WELCOME_LOGO, DEFAULT_MENU, DEFAULT_CATS, DEFAULT_PROMOS, WELCOME_IMGS } from "./constants.js";

const fmt = (n) => "$" + Number(n).toLocaleString("es-CL");

export default function NomadeKafeTotem() {
  const [view, setView] = useState("welcome"); // welcome, app, pin, admin
  const [menu, setMenu] = useState(() => loadJSON(STORAGE_KEYS.overrides, DEFAULT_MENU));
  const [categorias, setCategorias] = useState(() => loadJSON("kiosk_cats", DEFAULT_CATS));
  const [promos, setPromos] = useState(() => loadJSON(STORAGE_KEYS.promos, DEFAULT_PROMOS));
  const [homeImages, setHomeImages] = useState(() => loadJSON("kiosk_home_imgs", WELCOME_IMGS));

  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [processing, setProcessing] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  // Auto-slide home images
  useEffect(() => {
    if (view !== "welcome" || homeImages.length <= 1) return;
    const t = setInterval(() => setBgIndex(i => (i + 1) % homeImages.length), 4000);
    return () => clearInterval(t);
  }, [view, homeImages]);

  // Sync menu changes to LocalStorage
  useEffect(() => { saveJSON(STORAGE_KEYS.overrides, menu); }, [menu]);
  useEffect(() => { saveJSON("kiosk_cats", categorias); }, [categorias]);
  useEffect(() => { saveJSON(STORAGE_KEYS.promos, promos); }, [promos]);
  useEffect(() => { saveJSON("kiosk_home_imgs", homeImages); }, [homeImages]);

  const agregar = (item) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === item.id);
      if (existe) return prev.map((p) => p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const quitar = (id) => {
    setCarrito((prev) => prev.map((p) => p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p).filter((p) => p.cantidad > 0));
  };

  const pagar = () => {
    if (carrito.length === 0) return;
    setProcessing(true);
    setTimeout(() => {
      const order = { id: Date.now(), items: carrito, total, date: new Date().toISOString() };
      const orders = loadJSON(STORAGE_KEYS.orders, []);
      saveJSON(STORAGE_KEYS.orders, [...orders, order]);
      setCarrito([]);
      setProcessing(false);
      setView("welcome");
    }, 2000);
  };

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const productosFiltrados = categoriaActiva === "Todos" ? menu : menu.filter(m => m.categoria === categoriaActiva);

  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState(null);
  const handleAdminTap = () => {
    setTapCount(c => c + 1);
    if (tapTimer) clearTimeout(tapTimer);
    setTapTimer(setTimeout(() => setTapCount(0), 1000));
    if (tapCount >= 4) { setTapCount(0); setView("pin"); }
  };

  if (view === "welcome") {
    return (
      <div onClick={() => { setView("app"); setCategoriaActiva("Todos"); setCarrito([]); }} style={{ height:"100vh", width:"100vw", background:`url(${homeImages[bgIndex]}) center/cover`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"rgba(26,15,8,0.5)" }} />
        <img src={WELCOME_LOGO} alt="Nomade Kafe Welcome" style={{ width:320, zIndex:1, marginBottom:40, filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }} />
        <div style={{ zIndex:1, background:"#e8c99a", color:"#1a0f08", padding:"20px 48px", borderRadius:40, fontSize:28, fontWeight:700, fontFamily:"'Jost',sans-serif", letterSpacing:2, textTransform:"uppercase", boxShadow:"0 8px 24px rgba(0,0,0,0.3)", animation:"pulse 2s infinite" }}>Toque para comenzar</div>
        <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }`}</style>
      </div>
    );
  }

  if (view === "pin") {
    return <PinScreen onSuccess={() => setView("admin")} onCancel={() => setView("welcome")} />;
  }

  if (view === "admin") {
    return <AdminPanel onClose={() => setView("welcome")} menu={menu} setMenu={setMenu} cats={categorias} setCats={setCategorias} promos={promos} setPromos={setPromos} homeImages={homeImages} setHomeImages={setHomeImages} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", width: "100vw", backgroundColor: "#faf8f4", fontFamily: "'Jost', sans-serif" }}>
      
      <div style={{ flex: 3, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <header style={{ padding: "24px 32px", backgroundColor: "#1a0f08", color: "#e8c99a", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10 }}>
          <div onClick={handleAdminTap} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}>
            <img src={LOGO} alt="Logo" style={{ height: "48px" }} />
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, margin: 0, letterSpacing: "1px" }}>Nomade Kafé</h1>
              <p style={{ fontSize: "13px", opacity: 0.8, marginTop: "2px", fontWeight: 300, letterSpacing: "2px", textTransform: "uppercase" }}>Autoatención</p>
            </div>
          </div>
          <button onClick={() => setView("welcome")} style={{ background: "transparent", border: "1px solid #e8c99a", color: "#e8c99a", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}>
            Cancelar Pedido
          </button>
        </header>

        <div style={{ padding: "20px 32px", display: "flex", gap: "12px", overflowX: "auto", borderBottom: "1px solid #ede8e0", backgroundColor: "#fff", flexShrink: 0 }}>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              style={{
                padding: "12px 24px",
                borderRadius: "30px",
                border: categoriaActiva === cat ? "none" : "1px solid #d4c8b8",
                backgroundColor: categoriaActiva === cat ? "#1a0f08" : "#fff",
                color: categoriaActiva === cat ? "#e8c99a" : "#1a0f08",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px", alignContent: "start" }}>
          {productosFiltrados.map((item) => (
            <div key={item.id} onClick={() => agregar(item)} style={{ backgroundColor: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", cursor: "pointer", transition: "transform 0.1s ease, box-shadow 0.1s ease", border: "1px solid #f0ebe1", display: "flex", flexDirection: "column" }}>
              <div style={{ width: "100%", height: "200px", backgroundImage: `url(${item.imagen || ''})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#e0d8c8" }} />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1a0f08", margin: "0 0 8px 0" }}>{item.nombre}</h3>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 700, color: "#a08060", margin: 0 }}>{fmt(item.precio)}</p>
                </div>
                <button style={{ marginTop: "16px", backgroundColor: "#e8c99a", border: "none", color: "#1a0f08", padding: "12px", borderRadius: "8px", fontWeight: 700, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: "350px", maxWidth: "400px", backgroundColor: "#fff", borderLeft: "1px solid #ede8e0", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.05)", zIndex: 5 }}>
        
        <div style={{ padding: "24px", borderBottom: "1px solid #ede8e0", backgroundColor: "#faf8f4" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a0f08", margin: 0 }}>Tu Pedido</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {carrito.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.4 }}>
              <p style={{ fontSize: "18px", fontWeight: 500, textAlign: "center" }}>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px dashed #e8e0d4" }}>
                <div style={{ flex: 1, paddingRight: "12px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1a0f08", margin: "0 0 4px 0" }}>{item.nombre}</h4>
                  <p style={{ fontSize: "15px", color: "#a08060", fontWeight: 500, margin: 0 }}>{fmt(item.precio * item.cantidad)}</p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#faf8f4", padding: "6px", borderRadius: "12px", border: "1px solid #ede8e0" }}>
                  <button onClick={() => quitar(item.id)} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "none", backgroundColor: "#fff", fontSize: "20px", fontWeight: 600, color: "#1a0f08", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>-</button>
                  <span style={{ fontSize: "16px", fontWeight: 700, minWidth: "20px", textAlign: "center" }}>{item.cantidad}</span>
                  <button onClick={() => agregar(item)} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "none", backgroundColor: "#1a0f08", fontSize: "20px", fontWeight: 600, color: "#e8c99a", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "24px", borderTop: "1px solid #ede8e0", backgroundColor: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
            <span style={{ fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase", color: "#a08060", fontWeight: 600 }}>Total a Pagar</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "36px", fontWeight: 700, color: "#1a0f08" }}>{fmt(total)}</span>
          </div>
          <button 
            onClick={pagar} 
            disabled={processing || carrito.length === 0} 
            style={{ 
              width: "100%", 
              backgroundColor: processing || carrito.length === 0 ? "#d4c8b8" : "#1a0f08", 
              color: processing || carrito.length === 0 ? "#888" : "#e8c99a", 
              border: "none", 
              borderRadius: "12px", 
              padding: "20px 0", 
              fontSize: "18px", 
              fontWeight: 700, 
              cursor: processing || carrito.length === 0 ? "not-allowed" : "pointer", 
              letterSpacing: "2px", 
              textTransform: "uppercase", 
              transition: "background-color 0.2s" 
            }}
          >
            {processing ? "Procesando..." : "Proceder al Pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

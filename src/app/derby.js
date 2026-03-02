'use client'
import { useState, useRef, useMemo, useEffect, useCallback } from "react";

const STORES_INIT = [
  // EAST (🌴) — Dusty Blues
  { name: "Fred Anderson Toyota of Raleigh", region: "East", silk: "#4A6FA5", silkAlt: "#A8C4E0", abbr: "TRA", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Kia of Raleigh", region: "East", silk: "#5B7FB5", silkAlt: "#C1D6EA", abbr: "KRA", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Nissan of Raleigh", region: "East", silk: "#3D5F8C", silkAlt: "#94B4D4", abbr: "NRA", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Toyota of Sanford", region: "East", silk: "#6889B0", silkAlt: "#D0DEE9", abbr: "TSA", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Toyota of Charleston", region: "East", silk: "#2E4F73", silkAlt: "#7FA5C4", abbr: "TCH", calls: 0, mystery: 0, coaching: 0 },
  // WEST (🏔) — Olive Greens
  { name: "Fred Anderson Subaru", region: "West", silk: "#5C6B3C", silkAlt: "#B5C49A", abbr: "SAS", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Toyota of Asheville", region: "West", silk: "#6B7D45", silkAlt: "#C4D3A5", abbr: "TAS", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Nissan of Asheville", region: "West", silk: "#4E5D32", silkAlt: "#A3B285", abbr: "NAS", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Kia of Greer", region: "West", silk: "#7A8C52", silkAlt: "#D1DCBA", abbr: "KGR", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Toyota Greer", region: "West", silk: "#8A9A62", silkAlt: "#DDE5CC", abbr: "TGR", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Chevy Buick GMC Cadillac", region: "West", silk: "#6E7F48", silkAlt: "#C8D5AD", abbr: "CGR", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Hyundai", region: "West", silk: "#55693A", silkAlt: "#AFC092", abbr: "HGR", calls: 0, mystery: 0, coaching: 0 },
  { name: "Genesis of Greer", region: "West", silk: "#445530", silkAlt: "#9AAD7E", abbr: "GGR", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Acura", region: "West", silk: "#637844", silkAlt: "#BDCCA2", abbr: "AGV", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Kia of Greenville", region: "West", silk: "#768B50", silkAlt: "#CDDAB5", abbr: "KGV", calls: 0, mystery: 0, coaching: 0 },
  { name: "Fred Anderson Honda of Greenville", region: "West", silk: "#4A5E35", silkAlt: "#A6B88C", abbr: "HGV", calls: 0, mystery: 0, coaching: 0 },
];

const CATEGORIES = [
  { key: "calls", label: "Call Monitoring", desc: "2 diff people following call guide", icon: "📞", short: "Calls", pts: 3 },
  { key: "mystery", label: "Mystery Shop", desc: "Phone mystery shop score", icon: "🕵️", short: "Mystery", pts: 1 },
  { key: "coaching", label: "Mgr Ring Ring Session", desc: "Manager attends Ring Ring session", icon: "🎯", short: "Mgr RR", pts: 5 },
];

// Race phases: loading → gate → countdown → racing → settled → reveal
const PHASES = { LOADING: 0, GATE: 1, COUNTDOWN: 2, RACING: 3, SETTLED: 4, REVEAL: 5 };

function getTrackPos(progress, cx, cy, rx, ry) {
  const angle = -Math.PI / 2 + progress * 2 * Math.PI;
  return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), angle };
}

function getTotal(store) {
  return (store.calls * 3) + (store.mystery * 1) + (store.coaching * 5);
}

export default function RingRingDerby() {
  const [stores, setStores] = useState(STORES_INIT);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [hoveredHorse, setHoveredHorse] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [countdownNum, setCountdownNum] = useState(3);
  const [raceProgress, setRaceProgress] = useState(0); // 0 to 1
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [howToScoreOpen, setHowToScoreOpen] = useState(false);
  const inputRef = useRef(null);

  // Load saved scores on mount
  useEffect(() => {
    const loadScores = () => {
      try {
        const raw = localStorage.getItem("derby-scores");
        if (raw) {
          const saved = JSON.parse(raw);
          setStores(prev => prev.map(store => {
            const savedStore = saved.find(s => s.abbr === store.abbr);
            if (savedStore) {
              return { ...store, calls: savedStore.calls || 0, mystery: savedStore.mystery || 0, coaching: savedStore.coaching || 0 };
            }
            return store;
          }));
        }
      } catch (e) {}
      setLoaded(true);
    };
    loadScores();
  }, []);

  // Save scores whenever they change
  useEffect(() => {
    if (!loaded) return;
    try {
      const toSave = stores.map(s => ({ abbr: s.abbr, calls: s.calls, mystery: s.mystery, coaching: s.coaching }));
      localStorage.setItem("derby-scores", JSON.stringify(toSave));
    } catch (e) {}
  }, [stores, loaded]);

  useEffect(() => {
    const checkAdmin = () => setIsAdmin(window.location.hash === "#admin");
    checkAdmin();
    window.addEventListener("hashchange", checkAdmin);
    return () => window.removeEventListener("hashchange", checkAdmin);
  }, []);

  // Race animation sequence
  useEffect(() => {
    if (!loaded) return;

    // Gate phase — horses at starting line
    setPhase(PHASES.GATE);

    const t1 = setTimeout(() => {
      setPhase(PHASES.COUNTDOWN);
      setCountdownNum(3);
    }, 800);

    const t2 = setTimeout(() => setCountdownNum(2), 1800);
    const t3 = setTimeout(() => setCountdownNum(1), 2800);

    const t4 = setTimeout(() => {
      setPhase(PHASES.RACING);
      // Animate progress from 0 to 1
      let start = null;
      const duration = 2200;
      const animate = (ts) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic for dramatic slowdown at end
        const eased = 1 - Math.pow(1 - t, 3);
        setRaceProgress(eased);
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          setPhase(PHASES.SETTLED);
        }
      };
      requestAnimationFrame(animate);
    }, 3600);

    // Reveal standings after settle
    const t5 = setTimeout(() => {
      setPhase(PHASES.REVEAL);
      setStandingsOpen(true);
    }, 6200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [loaded]);

  const maxScore = Math.max(...stores.map(getTotal), 1);
  const rankedStores = [...stores].sort((a, b) => getTotal(b) - getTotal(a));
  const eastTotal = stores.filter(s => s.region === "East").reduce((sum, s) => sum + getTotal(s), 0);
  const westTotal = stores.filter(s => s.region === "West").reduce((sum, s) => sum + getTotal(s), 0);
  const regionMax = Math.max(eastTotal + westTotal, 1);

  const now = new Date();
  const deadlineDate = new Date("2026-03-31T23:59:59");
  const daysLeft = Math.max(0, Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)));

  const handleCellClick = (name, key, value) => {
    if (!isAdmin) return;
    setEditingCell({ name, key });
    setInputVal(String(value));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitEdit = () => {
    if (editingCell) {
      const val = Math.max(0, Math.min(999, parseInt(inputVal) || 0));
      setStores(p => p.map(s => s.name === editingCell.name ? { ...s, [editingCell.key]: val } : s));
    }
    setEditingCell(null);
    setInputVal("");
  };

  const svgW = 900;
  const svgH = 520;
  const cx = svgW / 2;
  const cy = svgH / 2 + 10;
  const rx = 340;
  const ry = 170;

  // During racing, interpolate positions from gate (0) to final
  const getAnimatedProgress = useCallback((store, i) => {
    const total = getTotal(store);
    const finalProgress = maxScore > 0 ? Math.min(total / maxScore, 0.97) : 0;
    const finalStaggered = total === 0 ? (i * 0.004) : finalProgress;

    if (phase <= PHASES.COUNTDOWN) {
      // All at starting gate, slightly staggered so they're not stacked
      return i * 0.003;
    } else if (phase === PHASES.RACING) {
      // Interpolate from gate to final position
      const gatePos = i * 0.003;
      return gatePos + (finalStaggered - gatePos) * raceProgress;
    }
    return finalStaggered;
  }, [phase, raceProgress, maxScore]);

  const horsesWithPos = useMemo(() => {
    return stores.map((store, i) => {
      const progress = getAnimatedProgress(store, i);
      const pos = getTrackPos(progress, cx, cy, rx, ry);
      return { store, pos, i, total: getTotal(store) };
    }).sort((a, b) => a.pos.y - b.pos.y);
  }, [stores, getAnimatedProgress]);

  const dirtDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < 500; i++) {
      const angle = (i / 500) * Math.PI * 2;
      const rVar = 0.85 + Math.random() * 0.3;
      const px = cx + (rx + 12) * rVar * Math.cos(angle);
      const py = cy + (ry + 8) * rVar * Math.sin(angle);
      const dist = Math.sqrt(((px - cx) / (rx + 30)) ** 2 + ((py - cy) / (ry + 22)) ** 2);
      if (dist > 0.75 && dist < 1.25) {
        dots.push({ x: px, y: py, r: 0.3 + Math.random() * 0.8, o: 0.03 + Math.random() * 0.08, c: Math.floor(Math.random() * 3) });
      }
    }
    return dots;
  }, []);

  const renderEditor = (region) => {
    const regionStores = stores.filter(s => s.region === region);
    const isEast = region === "East";
    return (
      <div style={{ marginBottom: isEast ? "16px" : 0 }}>
        <div style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
          marginBottom: "8px", paddingLeft: "4px",
          color: isEast ? "#4A6FA5" : "#5C6B3C",
        }}>
          {isEast ? "🌴" : "🏔"} {region}
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "48px 1fr 58px 58px 58px 46px",
          gap: "3px", padding: "0 6px", marginBottom: "6px",
        }}>
          <div />
          <div style={{ fontSize: "8px", fontWeight: 700, color: "#bbb", textTransform: "uppercase" }}>Store</div>
          {CATEGORIES.map(c => (
            <div key={c.key} style={{ fontSize: "8px", fontWeight: 700, color: "#bbb", textTransform: "uppercase", textAlign: "center", lineHeight: "1.3" }}>
              {c.icon}<br /><span style={{ color: "#ccc" }}>{c.pts}pt</span>
            </div>
          ))}
          <div style={{ fontSize: "8px", fontWeight: 700, color: "#bbb", textTransform: "uppercase", textAlign: "center" }}>Pts</div>
        </div>
        {regionStores.map(store => (
          <div key={store.name} style={{
            display: "grid", gridTemplateColumns: "48px 1fr 58px 58px 58px 46px",
            gap: "3px", padding: "5px 6px", borderRadius: "8px",
            background: "white", border: "1px solid #f0f0f0", marginBottom: "3px", alignItems: "center",
          }}>
            <div style={{
              fontSize: "11px", fontWeight: 800, color: store.silk,
              background: `${store.silk}0d`, padding: "2px 6px", borderRadius: "4px", textAlign: "center",
            }}>{store.abbr}</div>
            <div style={{ fontSize: "10px", fontWeight: 500, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
            {CATEGORIES.map(cat => {
              const isEditing = editingCell?.name === store.name && editingCell?.key === cat.key;
              return (
                <div key={cat.key} onClick={() => handleCellClick(store.name, cat.key, store[cat.key])}
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", cursor: isAdmin ? "pointer" : "default" }}>
                  {isEditing ? (
                    <input ref={inputRef} type="number" value={inputVal}
                      onChange={e => setInputVal(e.target.value)} onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commitEdit(); }}}
                      style={{
                        width: "40px", padding: "2px 4px", borderRadius: "5px",
                        border: `1px solid ${store.silk}`, background: "#fafafa",
                        color: store.silk, fontSize: "13px", fontWeight: 700,
                        fontFamily: "'Inter', sans-serif", textAlign: "center", outline: "none",
                      }} />
                  ) : (
                    <span style={{
                      fontSize: "13px", fontWeight: 700,
                      color: store[cat.key] > 0 ? store.silk : "#ddd",
                    }}>{store[cat.key]}</span>
                  )}
                </div>
              );
            })}
            <div style={{ fontSize: "14px", fontWeight: 800, color: getTotal(store) > 0 ? "#1a1a1a" : "#ddd", textAlign: "center" }}>{getTotal(store)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#1a1a1a",
      padding: "24px 16px",
    }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseCount { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideDown { from { max-height: 0; opacity: 0; } to { max-height: 2000px; opacity: 1; } }
        @keyframes bannerIn { 0% { transform: scaleX(0); opacity: 0; } 60% { transform: scaleX(1.05); } 100% { transform: scaleX(1); opacity: 1; } }
        @keyframes dust { 0% { opacity: 0.6; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(-20px, -10px) scale(2); } }
        .standing-row { animation: fadeInUp 0.4s ease both; }
      `}</style>

      {!loaded ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏇</div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#bbb", letterSpacing: "2px", textTransform: "uppercase" }}>Loading scores...</div>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px", animation: "fadeIn 0.6s ease" }}>
        <div style={{ fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", color: "#bbb", fontWeight: 600, marginBottom: "8px" }}>
          Anderson Automotive Group
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, margin: "0", color: "#1a1a1a", lineHeight: 1.1, letterSpacing: "-1px" }}>
          The Ring Ring Derby 🏇
        </h1>
        <div style={{ fontSize: "13px", color: "#bbb", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px" }}>
          Phone Training Championship · March 2026
        </div>
      </div>

      {/* Countdown + Region Scores */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap", animation: "fadeInUp 0.6s ease 0.2s both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", background: "#EDF2F8", border: "1px solid #C8D6E5", borderRadius: "12px" }}>
          <span style={{ fontSize: "16px" }}>🌴</span>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#4A6FA5" }}>East</span>
          <span style={{ fontSize: "24px", fontWeight: 900, color: "#4A6FA5" }}>{phase >= PHASES.SETTLED ? eastTotal : "—"}</span>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "8px 20px", background: daysLeft <= 7 ? "#FEF2F2" : "#F9FAFB",
          border: `1px solid ${daysLeft <= 7 ? "#FECACA" : "#E5E7EB"}`, borderRadius: "12px",
        }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: daysLeft <= 7 ? "#DC2626" : "#1a1a1a" }}>{daysLeft}</span>
          <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999" }}>days left</span>
          <span style={{ fontSize: "9px", color: "#ccc", marginTop: "1px" }}>ends March 31</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", background: "#F4F6EF", border: "1px solid #D5DCCA", borderRadius: "12px" }}>
          <span style={{ fontSize: "16px" }}>🏔</span>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#5C6B3C" }}>West</span>
          <span style={{ fontSize: "24px", fontWeight: 900, color: "#5C6B3C" }}>{phase >= PHASES.SETTLED ? westTotal : "—"}</span>
        </div>
      </div>

      {/* East vs West bar — only after settled */}
      <div style={{
        maxWidth: "500px", margin: "0 auto 18px",
        opacity: phase >= PHASES.SETTLED ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}>
        <div style={{ display: "flex", height: "28px", borderRadius: "14px", overflow: "hidden", background: "#f0f0f0" }}>
          <div style={{
            width: regionMax > 0 ? `${(eastTotal / regionMax) * 100}%` : "50%",
            background: "linear-gradient(90deg, #2E4F73, #5B7FB5)",
            transition: "width 1.2s cubic-bezier(0.34, 1.08, 0.64, 1)",
            display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "10px", minWidth: "40px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "white" }}>🌴 {eastTotal}</span>
          </div>
          <div style={{
            width: regionMax > 0 ? `${(westTotal / regionMax) * 100}%` : "50%",
            background: "linear-gradient(90deg, #7A8C52, #4E5D32)",
            transition: "width 1.2s cubic-bezier(0.34, 1.08, 0.64, 1)",
            display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "10px", minWidth: "40px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "white" }}>{westTotal} 🏔</span>
          </div>
        </div>
      </div>

      {/* How to Score — accordion */}
      <div style={{ maxWidth: "480px", margin: "0 auto 18px" }}>
        <button onClick={() => setHowToScoreOpen(!howToScoreOpen)} style={{
          width: "100%", padding: "12px 18px", background: "#FAFAFA", borderRadius: howToScoreOpen ? "12px 12px 0 0" : "12px",
          border: "1px solid #eee", borderBottom: howToScoreOpen ? "none" : "1px solid #eee",
          cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
          fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#999" }}>
            How to Score Points
          </span>
          <span style={{ fontSize: "12px", color: "#ccc", transition: "transform 0.3s ease", transform: howToScoreOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </button>
        <div style={{
          overflow: "hidden",
          maxHeight: howToScoreOpen ? "300px" : "0",
          transition: "max-height 0.4s ease",
          background: "#FAFAFA", borderRadius: "0 0 12px 12px",
          border: howToScoreOpen ? "1px solid #eee" : "none",
          borderTop: "none",
        }}>
          <div style={{ padding: "0 18px 14px" }}>
            {CATEGORIES.map((c, idx) => (
              <div key={c.key} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 0",
                borderBottom: idx < CATEGORIES.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <span style={{ fontSize: "20px", width: "28px", textAlign: "center" }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>{c.label}</div>
                  <div style={{ fontSize: "11px", fontWeight: 400, color: "#999" }}>{c.desc}</div>
                </div>
                <div style={{
                  fontSize: "16px", fontWeight: 900, color: "#1a1a1a",
                  background: "#f0f0f0", padding: "3px 10px", borderRadius: "8px",
                  minWidth: "45px", textAlign: "center",
                }}>+{c.pts}</div>
              </div>
            ))}
            <div style={{ fontSize: "10px", color: "#999", textAlign: "center", marginTop: "10px", fontWeight: 600 }}>
              All entries must be submitted to Liza for scoring
            </div>
            <div style={{ fontSize: "10px", color: "#bbb", textAlign: "center", marginTop: "2px" }}>
              Most points by March 31 wins 🏆
            </div>
          </div>
        </div>
      </div>

      {/* Admin editor */}
      {isAdmin && (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <button onClick={() => setShowEditor(!showEditor)} style={{
              padding: "8px 22px", borderRadius: "10px",
              border: `1px solid ${showEditor ? "#5C6B3C" : "#e5e5e5"}`,
              background: showEditor ? "#F4F6EF" : "#fafafa",
              color: showEditor ? "#5C6B3C" : "#888", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}>{showEditor ? "✏️ Close Editor" : "✏️ Update Scores"}</button>
          </div>
          {showEditor && (
            <div style={{ maxWidth: "880px", margin: "0 auto 18px", padding: "16px", background: "#fafafa", borderRadius: "14px", border: "1px solid #eee", overflowX: "auto" }}>
              <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", textAlign: "center", fontWeight: 600 }}>
                🔒 Admin Mode · Tap any score to edit · Enter to save
              </div>
              <div style={{ minWidth: "500px" }}>
                {renderEditor("East")}
                {renderEditor("West")}
              </div>
            </div>
          )}
        </>
      )}

      {/* THE TRACK */}
      <div style={{ maxWidth: "940px", margin: "0 auto", position: "relative" }}>
        <div style={{ perspective: "1600px", perspectiveOrigin: "50% 15%" }}>
          <div style={{ transform: "rotateX(14deg)", transformOrigin: "50% 50%", position: "relative" }}>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: "16px", overflow: "hidden" }}>
              <defs>
                <radialGradient id="grassField" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="40%" stopColor="#16a34a" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.2" />
                </radialGradient>
                <linearGradient id="dirtMain" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a3784a" />
                  <stop offset="50%" stopColor="#8b6838" />
                  <stop offset="100%" stopColor="#7a5a30" />
                </linearGradient>
                <filter id="trackShadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.12)" />
                </filter>
              </defs>

              <rect width={svgW} height={svgH} fill="#f8faf8" />
              <ellipse cx={cx} cy={cy} rx={rx + 50} ry={ry + 38} fill="#f0f4f0" />
              <ellipse cx={cx} cy={cy} rx={rx + 30} ry={ry + 22} fill="none" stroke="url(#dirtMain)" strokeWidth="62" filter="url(#trackShadow)" />

              {dirtDots.map((d, i) => {
                const colors = ["rgba(160,110,60,", "rgba(140,95,50,", "rgba(180,125,70,"];
                return <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`${colors[d.c]}${d.o})`} />;
              })}

              {[rx + 18, rx + 8, rx - 2, rx - 10].map((r, i) => (
                <ellipse key={`g${i}`} cx={cx} cy={cy} rx={r} ry={ry + (r - rx) * 0.7} fill="none"
                  stroke={`rgba(120,85,45,${0.08 + i * 0.02})`} strokeWidth="0.7" />
              ))}

              <ellipse cx={cx} cy={cy} rx={rx + 32} ry={ry + 24} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
              {Array.from({ length: 52 }).map((_, i) => {
                const a = (i / 52) * Math.PI * 2;
                return <line key={`rp${i}`} x1={cx + (rx + 32) * Math.cos(a)} y1={cy + (ry + 24) * Math.sin(a)} x2={cx + (rx + 32) * Math.cos(a)} y2={cy + (ry + 24) * Math.sin(a) - 5} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />;
              })}
              <ellipse cx={cx} cy={cy - 2.5} rx={rx + 32} ry={ry + 24} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <ellipse cx={cx} cy={cy} rx={rx - 4} ry={ry - 4} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              {Array.from({ length: 44 }).map((_, i) => {
                const a = (i / 44) * Math.PI * 2;
                return <line key={`ip${i}`} x1={cx + (rx - 4) * Math.cos(a)} y1={cy + (ry - 4) * Math.sin(a)} x2={cx + (rx - 4) * Math.cos(a)} y2={cy + (ry - 4) * Math.sin(a) - 4} stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />;
              })}

              <ellipse cx={cx} cy={cy} rx={rx - 8} ry={ry - 7} fill="#e8f5e9" />
              <ellipse cx={cx} cy={cy} rx={rx - 8} ry={ry - 7} fill="url(#grassField)" />
              {Array.from({ length: 14 }).map((_, i) => (
                <ellipse key={`mow${i}`} cx={cx} cy={cy} rx={(rx - 30) * (1 - i * 0.055)} ry={(ry - 25) * (1 - i * 0.055)}
                  fill="none" stroke={i % 2 === 0 ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.05)"} strokeWidth="4" />
              ))}

              <text x={cx} y={cy - 18} textAnchor="middle" fill="rgba(0,0,0,0.05)" fontSize="44" fontFamily="'Inter', sans-serif" fontWeight="900" letterSpacing="4">RING RING</text>
              <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(0,0,0,0.035)" fontSize="26" fontFamily="'Inter', sans-serif" fontWeight="800" letterSpacing="6">DERBY</text>

              <g transform={`translate(${cx}, ${cy + 52})`}>
                <rect x="-72" y="-9" width="62" height="18" rx="6" fill="rgba(74,111,165,0.08)" stroke="rgba(74,111,165,0.15)" strokeWidth="0.5" />
                <text x="-60" y="1" fontSize="11">🌴</text>
                <text x="-46" y="5" fill="#4A6FA5" fontSize="10" fontFamily="'Inter', sans-serif" fontWeight="700">EAST</text>
                <rect x="10" y="-9" width="62" height="18" rx="6" fill="rgba(92,107,60,0.08)" stroke="rgba(92,107,60,0.15)" strokeWidth="0.5" />
                <text x="22" y="1" fontSize="11">🏔</text>
                <text x="36" y="5" fill="#5C6B3C" fontSize="10" fontFamily="'Inter', sans-serif" fontWeight="700">WEST</text>
              </g>

              {/* Finish line */}
              {(() => {
                const inner = getTrackPos(0, cx, cy, rx - 4, ry - 4);
                const outer = getTrackPos(0, cx, cy, rx + 32, ry + 24);
                const dx = outer.x - inner.x;
                const dy = outer.y - inner.y;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                return (
                  <g>
                    {Array.from({ length: 14 }).map((_, row) =>
                      Array.from({ length: 2 }).map((_, col) => {
                        const t = row / 14;
                        const fx = inner.x + dx * t;
                        const fy = inner.y + dy * t;
                        return (
                          <rect key={`ck${row}-${col}`} x={fx - 3 + col * 3} y={fy - 1.5} width={3} height={3}
                            fill={(row + col) % 2 === 0 ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)"}
                            transform={`rotate(${angle}, ${fx}, ${fy})`} />
                        );
                      })
                    )}
                  </g>
                );
              })()}

              {/* Countdown overlay */}
              {phase === PHASES.COUNTDOWN && (
                <g>
                  <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(0,0,0,0.15)" fontSize="120"
                    fontFamily="'Inter', sans-serif" fontWeight="900"
                    style={{ animation: "pulseCount 0.9s ease" }} key={countdownNum}>
                    {countdownNum}
                  </text>
                </g>
              )}

              {/* "They're Off!" banner */}
              {phase === PHASES.RACING && raceProgress < 0.3 && (
                <g style={{ animation: "fadeIn 0.3s ease" }}>
                  <rect x={cx - 100} y={cy - 18} width="200" height="36" rx="18" fill="rgba(0,0,0,0.08)"
                    style={{ animation: "bannerIn 0.4s ease" }} />
                  <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(0,0,0,0.2)" fontSize="18"
                    fontFamily="'Inter', sans-serif" fontWeight="800" letterSpacing="3">THEY'RE OFF!</text>
                </g>
              )}

              {/* HORSES */}
              {horsesWithPos.map(({ store, pos, i: idx, total }) => {
                const isLeading = rankedStores[0]?.name === store.name && total > 0 && phase >= PHASES.SETTLED;
                const isHovered = hoveredHorse === store.name;
                const depthScale = 0.5 + (pos.y / svgH) * 0.5;
                const facingRight = Math.cos(pos.angle) >= 0;
                const emojiSize = Math.max(18, 30 * depthScale);

                return (
                  <g key={store.name}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredHorse(store.name)}
                    onMouseLeave={() => setHoveredHorse(null)}>

                    {isLeading && (
                      <>
                        <circle r={emojiSize * 0.9} fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="2" strokeDasharray="3 4">
                          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
                        </circle>
                        <text textAnchor="middle" y={-emojiSize * 0.65 - 4} fontSize={emojiSize * 0.5}>👑</text>
                      </>
                    )}

                    <circle r={emojiSize * 0.6} fill={`${store.silk}22`} stroke={store.silk} strokeWidth={1.5 * depthScale} />
                    <ellipse cx={1} cy={emojiSize * 0.5} rx={emojiSize * 0.45} ry={emojiSize * 0.1} fill="rgba(0,0,0,0.12)" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={emojiSize}
                      style={{ transform: facingRight ? "scaleX(1)" : "scaleX(-1)" }}>🏇</text>

                    <g transform={`translate(0, ${emojiSize * 0.65 + 5})`}>
                      <rect x="-15" y="-7" width="30" height="14" rx="4" fill={store.silk} />
                      <text textAnchor="middle" y="3.5" fill="white" fontSize={Math.max(7, 8.5 * depthScale)} fontWeight="700"
                        fontFamily="'Inter', sans-serif" letterSpacing="0.8">{store.abbr}</text>
                    </g>

                    {/* Score pill — only show after settled */}
                    {phase >= PHASES.SETTLED && (
                      <g transform={`translate(${emojiSize * 0.5 + 2}, ${-emojiSize * 0.35})`} style={{ animation: "fadeIn 0.5s ease" }}>
                        <rect x="-9" y="-8" width="18" height="16" rx="8" fill="white" stroke={store.silk} strokeWidth="1.2" />
                        <text textAnchor="middle" y="3" fill={store.silk} fontSize="8" fontWeight="800" fontFamily="'Inter', sans-serif">{total}</text>
                      </g>
                    )}

                    {isHovered && phase >= PHASES.SETTLED && (
                      <g transform={`translate(0, ${-emojiSize * 0.7 - 34})`}>
                        <rect x="-82" y="-20" width="164" height="46" rx="10"
                          fill="white" stroke="#e5e5e5" strokeWidth="1"
                          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }} />
                        <text x="0" y="-5" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="700" fontFamily="'Inter', sans-serif">{store.abbr} — {store.name}</text>
                        <text x="0" y="9" textAnchor="middle" fill="#888" fontSize="8" fontWeight="600" fontFamily="'Inter', sans-serif">
                          📞 {store.calls}×3 · 🕵️ {store.mystery}×1 · 🎯 {store.coaching}×5
                        </text>
                        <text x="0" y="21" textAnchor="middle" fill={store.region === "East" ? "#4A6FA5" : "#5C6B3C"}
                          fontSize="9" fontWeight="700" fontFamily="'Inter', sans-serif">
                          {store.region === "East" ? "🌴" : "🏔"} {store.region} · {total} pts
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Standings — accordion that opens after race */}
      <div style={{ maxWidth: "720px", margin: "20px auto 0" }}>
        <button onClick={() => setStandingsOpen(!standingsOpen)} style={{
          width: "100%", padding: "14px 18px", background: "#fafafa", borderRadius: standingsOpen ? "14px 14px 0 0" : "14px",
          border: "1px solid #eee", borderBottom: standingsOpen ? "none" : "1px solid #eee",
          cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
          fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#bbb", fontWeight: 700 }}>
            🏆 Standings
          </span>
          <span style={{ fontSize: "12px", color: "#ccc", transition: "transform 0.3s ease", transform: standingsOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </button>
        <div style={{
          overflow: "hidden",
          maxHeight: standingsOpen ? "2000px" : "0",
          transition: "max-height 0.6s ease",
          background: "#fafafa", borderRadius: "0 0 14px 14px",
          border: standingsOpen ? "1px solid #eee" : "none", borderTop: "none",
        }}>
          <div style={{ padding: "0 12px 16px" }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "26px 16px 46px 1fr 40px 40px 40px 44px",
              gap: "4px", padding: "8px 8px 6px", borderBottom: "1px solid #eee", marginBottom: "4px",
            }}>
              <div />
              <div />
              <div />
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#ccc", textTransform: "uppercase" }}>Store</div>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#ccc", textAlign: "center" }}>📞</div>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#ccc", textAlign: "center" }}>🕵️</div>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#ccc", textAlign: "center" }}>🎯</div>
              <div style={{ fontSize: "8px", fontWeight: 700, color: "#ccc", textAlign: "right" }}>Pts</div>
            </div>
            {rankedStores.map((store, i) => {
              const total = getTotal(store);
              return (
                <div key={store.name} className="standing-row" style={{
                  display: "grid", gridTemplateColumns: "26px 16px 46px 1fr 40px 40px 40px 44px",
                  gap: "4px", padding: "5px 8px", borderRadius: "8px", alignItems: "center",
                  background: i === 0 ? "#FAFBF5" : "white",
                  border: `1px solid ${i === 0 ? "#D5DCCA" : "#f5f5f5"}`,
                  marginBottom: "2px",
                  animationDelay: `${i * 0.06}s`,
                }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 800, textAlign: "center",
                    color: i === 0 ? "#6B7D45" : i === 1 ? "#9CA3AF" : i === 2 ? "#8A9A62" : "#e5e5e5",
                  }}>{i === 0 ? "👑" : i + 1}</span>
                  <span style={{ fontSize: "11px", textAlign: "center" }}>{store.region === "East" ? "🌴" : "🏔"}</span>
                  <div style={{
                    fontSize: "11px", fontWeight: 800, color: store.silk,
                    background: `${store.silk}0d`, padding: "2px 4px", borderRadius: "4px", textAlign: "center",
                  }}>{store.abbr}</div>
                  <div style={{ fontSize: "10px", fontWeight: 500, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: store.calls > 0 ? "#555" : "#e5e5e5", textAlign: "center" }}>{store.calls}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: store.mystery > 0 ? "#555" : "#e5e5e5", textAlign: "center" }}>{store.mystery}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: store.coaching > 0 ? "#555" : "#e5e5e5", textAlign: "center" }}>{store.coaching}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: total > 0 ? "#1a1a1a" : "#e5e5e5", textAlign: "right" }}>{total}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "20px", fontSize: "9px", color: "#ddd", letterSpacing: "2px", textTransform: "uppercase" }}>
        The Ring Ring Derby · Anderson Automotive Group · 2026
      </div>
      </>
      )}
    </div>
  );
}

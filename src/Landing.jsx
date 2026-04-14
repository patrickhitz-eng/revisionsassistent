import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// REVISIONSASSISTENT.CH — Landing Page v2
// Futuristisch, Violet/Purple, Glassmorphism
// ═══════════════════════════════════════════════════════════════

const FEATURES = [
  { icon: "⚡", title: "PDF hochladen — fertig", desc: "Jahresrechnung als PDF hochladen. Die KI erkennt automatisch alle Bilanz- und Erfolgsrechnungspositionen, ordnet sie den 17 Prüfgebieten zu und berechnet Kennzahlen inkl. Vorjahresvergleich." },
  { icon: "🔎", title: "Automatische Firmenrecherche", desc: "Firmenname eingeben — die KI durchsucht das Handelsregister (ZEFIX), die Firmenwebsite und öffentliche Quellen. Rechtsform, Organe, Zweck, UID, Eigentümerstruktur und Branchenrisiken werden automatisch befüllt." },
  { icon: "🎯", title: "Risikobeurteilung per KI", desc: "Die KI beurteilt das inhärente Risiko für jedes der 17 Prüfgebiete: vernachlässigbar, normal oder erhöht. Mit Begründung, Fokus-Gebieten und Going-Concern-Einschätzung — alles nach SER Kapitel 3.3." },
  { icon: "📐", title: "Wesentlichkeit automatisch", desc: "Gesamtwesentlichkeit, Toleranzwesentlichkeit (65%) und Nichtaufgriffsgrenze (5%) — berechnet aus Gewinn vor Steuern, Umsatz, Bilanzsumme oder Eigenkapital. Inkl. Begründungslogik nach SER Kap. 5." },
  { icon: "✅", title: "Ja/Nein mit digitalem Stempel", desc: "Jeder Prüfpunkt wird mit Ja oder Nein bestätigt — automatisch gestempelt mit dem eingeloggten Benutzer und exaktem Zeitpunkt. Vollständig nachvollziehbar, wer was wann geprüft hat." },
  { icon: "📎", title: "Belege direkt ablegen", desc: "Pro Prüfgebiet können Belege hochgeladen werden: Bankauszüge, Inventarlisten, MWST-Abrechnungen, AfA-Spiegel als PDF, Bild oder Excel. Mit Stempel wer wann was abgelegt hat." },
  { icon: "✍️", title: "Digitale Signaturen per E-Mail", desc: "Auftragsbestätigung, Vollständigkeitserklärung und JR-Freigabe per E-Mail an den Mandanten senden. Bestätigung per Link — dokumentiert mit Zeitstempel, IP und SHA256-Hash." },
  { icon: "🚨", title: "Hilferuf-Button für Assistenten", desc: "Revisionsassistenten können jederzeit per Knopfdruck den Mandatsleiter benachrichtigen. Automatische E-Mail mit Mandatsname und Geschäftsjahr — sofortige Eskalation bei Problemen." },
  { icon: "📄", title: "PDF-Export — 8 Kapitel", desc: "Vollständige Revisionsdokumentation als druckbares A4-PDF: Deckblatt, Unabhängigkeit, Unternehmensverständnis, Jahresrechnung, Wesentlichkeit, Prüfprogramm, Übergreifendes, Berichterstattung." },
  { icon: "👥", title: "Team & Mandatsverwaltung", desc: "Mandanten anlegen, Revisionsjahre verwalten, Teammitglieder einladen, Mandatsleiter hinterlegen. Jedes Jahr mit eigenem 8-Schritt-Workflow, archivierbar für die Revisionsaufsicht." },
  { icon: "📋", title: "17 Prüfgebiete nach SER Anhang D", desc: "Von Flüssigen Mitteln bis zum Anhang (Art. 959c OR). Jedes Gebiet mit inhärentem Risiko, 7 Prüfungszielen (Vorhandensein bis Offenlegung), Befragungen, analytischen PH und Detailprüfungen." },
  { icon: "🔒", title: "Swiss Made & Datenschutz", desc: "Hosting in der Schweiz. Keine Verwendung von Mandantendaten für KI-Training. DSGVO-konform. Revisionsdokumentation bleibt vollständig unter Ihrer Kontrolle." },
];

const STEPS = [
  { num: "01", title: "Mandat anlegen", desc: "Firmenname und Website eingeben. Die KI recherchiert sofort im Handelsregister und auf der Website — Rechtsform, Organe, Zweck und Branche werden automatisch erkannt.", detail: "Handelsregister · Website · Öffentliche Quellen" },
  { num: "02", title: "Auftragsbestätigung versenden", desc: "Die Auftragsbestätigung nach SER Anhang C wird automatisch generiert — nur das Honorar muss angepasst werden. Per E-Mail an den VR senden, digital bestätigen lassen.", detail: "Auto-generiert · Honorar editierbar · Digitale Signatur" },
  { num: "03", title: "Jahresrechnung hochladen", desc: "PDF der Jahresrechnung hochladen. Die KI extrahiert alle Positionen, berechnet die Wesentlichkeit und erstellt die Risikobeurteilung automatisch.", detail: "PDF-Upload · Automatische Extraktion · Wesentlichkeitsberechnung" },
  { num: "04", title: "Prüfprogramm durcharbeiten", desc: "17 Prüfgebiete mit konkreten Prüfungshandlungen nach SER Anhang D. Jeden Punkt mit Ja/Nein bestätigen, Belege ablegen, Bemerkungen erfassen. Bei Problemen: Hilferuf an den Mandatsleiter.", detail: "17 Gebiete · Ja/Nein-Stempel · Belege · Hilferuf" },
  { num: "05", title: "Abschluss & PDF-Export", desc: "Vollständigkeitserklärung und JR-Freigabe per E-Mail einholen. Prüfungsaussage wählen. Vollständige Revisionsdokumentation als PDF exportieren — 8 Kapitel, aufsichtsrobust.", detail: "VE per E-Mail · JR-Freigabe · 8-Kapitel-PDF" },
];

export default function LandingPage({ onLogin }) {
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState("");
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", color: "#0a0a1a", background: "#fafafe" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes glow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s ease-out both; }
        .glass { background: rgba(255,255,255,0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="glass" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrollY > 50 ? "1px solid rgba(139,92,246,0.15)" : "1px solid transparent",
        transition: "all 0.3s"
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "white", fontWeight: 800
            }}>R</div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em" }}>Revisionsassistent</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 28 }}>
            {["Funktionen", "So funktioniert's", "Preise"].map(t => (
              <a key={t} href={`#${t.toLowerCase().replace(/[^a-z]/g,"")}`} style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontFamily: "'IBM Plex Sans'", fontWeight: 500, transition: "color 0.2s" }}
                 onMouseEnter={e => e.target.style.color = "#7c3aed"} onMouseLeave={e => e.target.style.color = "#64748b"}>{t}</a>
            ))}
            <button style={{
              padding: "9px 22px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans'"
            }}>Kostenlos testen</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", paddingTop: 80
      }}>
        {/* Animated gradient orbs */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", animation: "float 8s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite 2s", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", right: "30%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", animation: "float 7s ease-in-out infinite 4s", pointerEvents: "none" }} />
        
        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "radial-gradient(circle at 1px 1px, #7c3aed 1px, transparent 0)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: 760, padding: "0 32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 18px", borderRadius: 24,
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
            fontSize: 13, color: "#7c3aed", fontFamily: "'IBM Plex Sans'", fontWeight: 600,
            marginBottom: 32
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: "pulse 2s ease-in-out infinite" }} />
            SER 2022 · Eingeschränkte Revision · KI-gestützt
          </div>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.05,
            letterSpacing: "-0.04em", margin: "0 0 24px",
            background: "linear-gradient(135deg, #1a1a2e 0%, #7c3aed 50%, #a855f7 100%)",
            backgroundSize: "200% 200%", animation: "glow 6s ease infinite",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Revision.<br/>Neu gedacht.
          </h1>

          <p style={{
            fontSize: 20, lineHeight: 1.6, color: "#475569", maxWidth: 540, margin: "0 auto 36px",
            fontFamily: "'IBM Plex Sans'", fontWeight: 400
          }}>
            Die KI-gestützte Prüfungssoftware für Schweizer Revisoren. Von der Mandatsanlage bis zum Revisionsbericht — vollständig nach SER 2022.
          </p>

          <div style={{
            display: "flex", gap: 10, justifyContent: "center", maxWidth: 460, margin: "0 auto",
            padding: 4, borderRadius: 14, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)"
          }}>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@kanzlei.ch"
              style={{
                flex: 1, padding: "15px 20px", border: "none", borderRadius: 10,
                fontSize: 15, fontFamily: "'IBM Plex Sans'", outline: "none", background: "white"
              }}
            />
            <button onClick={() => { if (email.includes("@")) onLogin(email); else document.querySelector('input[placeholder="name@kanzlei.ch"]')?.focus(); }} style={{
              padding: "15px 32px",
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "white", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne'",
              whiteSpace: "nowrap", letterSpacing: "-0.01em"
            }}>Loslegen</button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
            {["Erste Revision gratis", "Keine Kreditkarte", "In 2 Min. startklar"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#a855f7", fontWeight: 700 }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────── */}
      <section style={{ padding: "48px 32px", background: "#0a0a1a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(124,58,237,0.1) 0%, rgba(168,85,247,0.05) 50%, rgba(59,130,246,0.1) 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-around", position: "relative", flexWrap: "wrap", gap: 20 }}>
          {[
            { n: "17", l: "Prüfgebiete nach SER" },
            { n: "8", l: "Kapitel im PDF-Export" },
            { n: "< 5 Min", l: "bis zum ersten Prüfprogramm" },
            { n: "100%", l: "SER 2022 konform" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#a855f7", letterSpacing: "-0.03em", fontFamily: "'Syne'" }}>{s.n}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="funktionen" style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, color: "#7c3aed", fontFamily: "'IBM Plex Sans'", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Funktionen</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Alles drin, was der SER verlangt
            </h2>
            <p style={{ fontSize: 17, color: "#64748b", fontFamily: "'IBM Plex Sans'", maxWidth: 520, margin: "0 auto" }}>
              Kein Schritt fehlt. Jede Prüfungshandlung nachvollziehbar dokumentiert. Von der Mandatsannahme bis zur Berichterstattung.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  padding: "28px 26px", borderRadius: 16,
                  border: `1px solid ${hoveredFeature === i ? "rgba(124,58,237,0.3)" : "#e2e8f0"}`,
                  background: hoveredFeature === i ? "rgba(124,58,237,0.03)" : "white",
                  transition: "all 0.3s ease",
                  transform: hoveredFeature === i ? "translateY(-2px)" : "none",
                  boxShadow: hoveredFeature === i ? "0 8px 32px rgba(124,58,237,0.08)" : "none"
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 16
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, fontFamily: "'IBM Plex Sans'", margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ──────────────────────────────────── */}
      <section id="sofunktionierts" style={{ padding: "100px 32px", background: "#0a0a1a", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 60%)", transform: "translateX(-50%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, color: "#a855f7", fontFamily: "'IBM Plex Sans'", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>So funktioniert's</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, color: "#f1f5f9" }}>
              5 Schritte zur fertigen Revision
            </h2>
            <p style={{ fontSize: 17, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", maxWidth: 480, margin: "0 auto" }}>
              Die KI macht die Fleissarbeit. Sie behalten das Fachurteil.
            </p>
          </div>

          {STEPS.map((s, i) => (
            <div key={i} style={{
              display: "flex", gap: 28, padding: "32px 0",
              borderBottom: i < STEPS.length - 1 ? "1px solid rgba(124,58,237,0.15)" : "none",
              alignItems: "flex-start"
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))",
                border: "1px solid rgba(124,58,237,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "#a855f7", fontFamily: "'JetBrains Mono'"
              }}>{s.num}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#f1f5f9", letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.65, fontFamily: "'IBM Plex Sans'", margin: "0 0 10px" }}>{s.desc}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {s.detail.split(" · ").map((d, j) => (
                    <span key={j} style={{
                      padding: "4px 12px", borderRadius: 6,
                      background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.15)",
                      fontSize: 11, color: "#c4b5fd", fontFamily: "'IBM Plex Sans'", fontWeight: 500
                    }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────── */}
      <section id="preise" style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 13, color: "#7c3aed", fontFamily: "'IBM Plex Sans'", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Preise</div>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Ein Preis. Keine Überraschungen.
            </h2>
            <p style={{ fontSize: 17, color: "#64748b", fontFamily: "'IBM Plex Sans'" }}>
              Pro Revision. Alles inklusive. Keine monatlichen Gebühren.
            </p>
          </div>

          <div style={{
            padding: "48px 40px", borderRadius: 24,
            background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)",
            border: "1px solid rgba(124,58,237,0.3)",
            position: "relative", overflow: "hidden", textAlign: "center"
          }}>
            {/* Glow effect */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 13, color: "#a855f7", fontFamily: "'IBM Plex Sans'", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Pro Revision</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", verticalAlign: "top", lineHeight: "60px" }}>CHF</span>
                <span style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: "-0.04em", margin: "0 4px" }}>19.90</span>
              </div>
              <p style={{ fontSize: 14, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", marginBottom: 32 }}>
                Exkl. MwSt. · Keine Abo-Pflicht · Zahlen Sie nur was Sie nutzen
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left", marginBottom: 32 }}>
                {[
                  "KI-Firmenrecherche",
                  "Automatische Wesentlichkeit",
                  "17 Prüfgebiete nach SER",
                  "KI-Risikobeurteilung",
                  "PDF-Upload & Extraktion",
                  "Digitale Signaturen",
                  "Ja/Nein mit Stempel",
                  "Belege pro Prüfgebiet",
                  "8-Kapitel PDF-Export",
                  "Auftragsbestätigung",
                  "Vollständigkeitserklärung",
                  "Team & Mandatsleiter",
                  "Hilferuf-Funktion",
                  "Unbegrenzte Mandate",
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: "#c4b5fd", fontFamily: "'IBM Plex Sans'" }}>
                    <span style={{ color: "#a855f7", fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <button style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white", border: "none", borderRadius: 12,
                fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne'",
                letterSpacing: "-0.01em"
              }}>Erste Revision gratis starten</button>
              <p style={{ fontSize: 12, color: "#64748b", fontFamily: "'IBM Plex Sans'", marginTop: 12 }}>
                Erste Revision kostenlos · Danach CHF 19.90 pro Revision
              </p>
            </div>
          </div>

          {/* Volume discount hint */}
          <div style={{
            marginTop: 20, padding: "20px 24px", borderRadius: 14,
            background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)",
            textAlign: "center"
          }}>
            <p style={{ fontSize: 14, color: "#475569", fontFamily: "'IBM Plex Sans'", margin: 0 }}>
              Grössere Kanzlei? <strong style={{ color: "#7c3aed" }}>Volumenrabatte ab 50 Revisionen/Jahr.</strong> Kontaktieren Sie uns.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────── */}
      <section style={{ padding: "100px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: "50%", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", transform: "translateX(-50%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Bereit für die digitale Revision?
          </h2>
          <p style={{ fontSize: 17, color: "#64748b", fontFamily: "'IBM Plex Sans'", marginBottom: 32 }}>
            Starten Sie in 2 Minuten. Ihr erstes Mandat ist kostenlos.
          </p>
          <button style={{
            padding: "16px 48px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "white", border: "none", borderRadius: 12,
            fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne'",
            boxShadow: "0 8px 32px rgba(124,58,237,0.25)"
          }}>Jetzt kostenlos starten</button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer style={{ padding: "48px 32px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 800 }}>R</div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Revisionsassistent</span>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'IBM Plex Sans'", margin: 0 }}>
              Ein Produkt der advisori GmbH · Spiez, Schweiz
            </p>
          </div>
          <div style={{ display: "flex", gap: 24, fontFamily: "'IBM Plex Sans'" }}>
            {["Datenschutz", "AGB", "Impressum", "Kontakt"].map(t => (
              <a key={t} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
                 onMouseEnter={e => e.target.style.color = "#7c3aed"} onMouseLeave={e => e.target.style.color = "#64748b"}>{t}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

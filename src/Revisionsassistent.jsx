import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// REVISIONSASSISTENT v3
// Login → Mandanten → Jahre → 8-Schritt SER 2022 Workflow
// Team, Hilferuf, PDF-Upload mit Claude API
// ═══════════════════════════════════════════════════════════════════

const S = {
  font: "'IBM Plex Sans',-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono',monospace",
  dark: "#0f172a", slate: "#1e293b", mid: "#334155", muted: "#64748b", hint: "#94a3b8",
  border: "#e2e8f0", bg: "#f8fafc", surface: "white",
  blue: "#3b82f6", blueL: "#eff6ff", blueB: "#bfdbfe",
  green: "#16a34a", greenL: "#f0fdf4", greenB: "#86efac",
  amber: "#d97706", amberL: "#fef3c7", amberB: "#fbbf24",
  red: "#dc2626", redL: "#fee2e2", redB: "#fca5a5",
};

// ── Style helpers ─────────────────────────────────────────────────
const btnP = (dis) => ({ padding: "11px 24px", background: dis ? S.hint : S.slate, color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: dis ? "not-allowed" : "pointer", fontFamily: S.font, transition: "all .15s" });
const btnS = () => ({ padding: "11px 24px", background: S.surface, color: S.muted, border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: S.font });
const btnSm = (bg = S.slate, c = "white") => ({ padding: "7px 16px", background: bg, color: c, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font });
const lbl = () => ({ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 });
const inp = () => ({ width: "100%", padding: "10px 14px", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontFamily: S.font, outline: "none" });
const crd = () => ({ background: S.surface, borderRadius: 10, border: `1px solid ${S.border}`, padding: "20px 24px", marginBottom: 14 });
const secT = () => ({ fontSize: 11, fontWeight: 600, color: S.hint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 });
const fmt = (n) => n == null ? "–" : n < 0 ? `(${Math.abs(n).toLocaleString("de-CH")})` : n.toLocaleString("de-CH");

// ── SER Data ──────────────────────────────────────────────────────
const INDEP_CHECKS = ["Tatsächliche Unabhängigkeit (Art. 729 Abs. 1 OR)", "Keine Beeinträchtigung dem Anschein nach", "Mitwirkung Buchführung: getrennte Personen (Art. 729 Abs. 2 OR)", "Andere DL mit Selbstprüfungsrisiko dokumentiert/getrennt", "Persönliche Unabhängigkeit aller Teammitglieder", "Finanzielle Unabhängigkeit (keine Beteiligung/Darlehen)", "Keine verwandtschaftlichen Beziehungen zu Organen", "Rotationsvorschriften eingehalten"];
const ACCEPT_CHECKS = ["Schwellenwerte 20-40-250 geprüft – keine ordentliche Revision nötig", "Kein Opting-up-Erfordernis", "Keine Konzernrechnungspflicht (Art. 963 OR)", "Keine Pflicht nach anerkanntem RL-Standard (Art. 962 OR)", "Keine rechtswidrige Beschränkung des Prüfungsumfangs", "Zulassung als Revisor bestätigt (RAB)", "Auftragsbestätigung erstellt (Anhang C)", "Qualitätssicherungssystem vorhanden (Art. 6 RAG)"];
const UNDERSTAND = [{ k: "industry", l: "Branche / Geschäftsmodell" }, { k: "legalForm", l: "Rechtsform" }, { k: "location", l: "Sitz / Standorte" }, { k: "owners", l: "Eigentümerstruktur" }, { k: "relatedParties", l: "Nahestehende Personen / Organe" }, { k: "accounting", l: "Rechnungswesen (intern/extern, Software)" }, { k: "keyRisks", l: "Wesentliche Geschäftsrisiken" }, { k: "special", l: "Besonderheiten des Unternehmens" }, { k: "changes", l: "Wesentliche Veränderungen ggü. Vorjahr" }];
const OBJECTIVES = ["Vorhandensein", "Rechte/Verpflichtungen", "Eintritt", "Vollständigkeit", "Bewertung", "Erfassung/Periodenabgrenzung", "Darstellung/Offenlegung"];
const RISK_LVL = ["vernachlässigbar", "normal", "erhöht"];

const AREAS = {
  cash: { n: "Flüssige Mittel", c: "Bilanz", r: ["Nicht offengelegte Verpfändungen", "Fehlerhafte FW-Umrechnung"], p: { i: ["Befragung Verpfändungen/Verfügungsbeschränkungen"], a: ["Vergleich Bestand VJ", "Plausibilisierung Zinsertrag"], d: ["Abstimmung Bank-/PC-Auszüge", "Vergleich FW-Kurse Jahresende"] } },
  receivables: { n: "Forderungen aus L&L", c: "Bilanz", r: ["Überbewertung/ungenügende WB", "Fiktive Forderungen"], p: { i: ["Durchsicht Debitoren-OP, Befragung alte/hohe Ausstände", "Befragung Verpfändung/Abtretung"], a: ["Vergleich Bestand VJ", "Beurteilung Altersstruktur", "Forderungen ggü. Nahestehenden"], d: ["Abstimmung OP-Liste Hauptbuch", "Beurteilung Wertberichtigungen"] } },
  inventory: { n: "Vorräte / nicht fakt. DL", c: "Bilanz", r: ["Fehlbewertung Niederstwert", "Überalterte Bestände"], p: { i: ["Befragung Methode Bestandsermittlung", "Befragung Bewertungsgrundlagen"], a: ["Vergleich Lagerumschlag VJ", "Vergleich Margen VJ"], d: ["Abstimmung Inventarlisten Hauptbuch"] } },
  fixedAssets: { n: "Sachanlagen / immat. Werte", c: "Bilanz", r: ["Fehlerhafte Aktivierung/AfA", "Unterlassene Wertbeeinträchtigung"], p: { i: ["Befragung Bewertungsgrundlagen/AfA", "Befragung Anschaffungen/Verkäufe"], a: ["Vergleich Bestände/AfA VJ"], d: ["Abstimmung Inventarliste mit JR"] } },
  financialAssets: { n: "Finanzanlagen / Beteiligungen", c: "Bilanz", r: ["Fehlerhafte Bewertung", "Nicht erkannte Wertminderungen"], p: { i: ["Befragung Bewertungsgrundsätze", "Besprechung Marktwerte"], a: ["Vergleich Buchwerte VJ"], d: ["Abstimmung Aufstellung mit JR", "Vergleich kotierter Titel mit Kursen"] } },
  payables: { n: "Verbindlichkeiten aus L&L", c: "Bilanz", r: ["Unvollständige Erfassung", "Fehlerhafte Periodenabgrenzung"], p: { i: ["Durchsicht OP, Befragung alte/hohe Posten"], a: ["Vergleich Bestand VJ"], d: ["Abstimmung Kreditoren-OP mit JR", "VLL ggü. Nahestehenden"] } },
  interestDebt: { n: "Verzinsliche Verbindlichkeiten", c: "Bilanz", r: ["Unvollständige Erfassung", "Covenant-Verletzungen"], p: { i: ["Befragung Kreditaufnahmen/Rückzahlungen", "Befragung Kreditbedingungen"], a: ["Plausibilisierung Zinsaufwand"], d: ["Abstimmung Kreditverträge/Bankauszüge"] } },
  provisions: { n: "Rückstellungen", c: "Bilanz", r: ["Zu hohe/tiefe Rückstellungen", "Fehlende Rückstellungen"], p: { i: ["Befragung pendente Risiken", "Besprechung finanzielles Ausmass"], a: ["Vergleich Bestand/Veränderung VJ"], d: ["Abstimmung Detailaufstellung JR"] } },
  accruals: { n: "Rechnungsabgrenzungen", c: "Bilanz", r: ["Fehlende/falsche Abgrenzungen"], p: { i: ["Befragung Werthaltigkeit"], a: ["Vergleich VJ-Bestände"], d: ["Abstimmung Detailaufstellung JR"] } },
  equity: { n: "Eigenkapital", c: "Bilanz", r: ["Fehlerhafte Gewinnverwendung", "Gesetzl. Reserven nicht eingehalten"], p: { i: ["Befragung Kapitalveränderungen"], a: ["Abstimmung Gewinnvortrag VJ"], d: ["Abstimmung Grundkapital Statuten/HR", "Prüfung GV-Beschluss", "Prüfung gesetzl. Reserven", "Eigene Anteile"] } },
  taxes: { n: "Steuern (MWST/direkte)", c: "Bilanz", r: ["Unvollständige Steuerrückstellungen", "Fehlerhafte MWST"], p: { i: ["Befragung Steuerrisiken", "Befragung MWST-Methode", "Alle Steuern VJ bezahlt/abgegrenzt?"], a: ["Plausibilisierung Steueraufwand", "Vergleich MWST-Schuld VJ"], d: ["Abstimmung MWST-Abrechnungen", "MWST-Umsatzabstimmung vorhanden?", "Abstimmung Steuerabgrenzung JR"] } },
  revenue: { n: "Nettoerlöse / Materialaufwand", c: "ER", r: ["Ertragsrealisation falsch zeitlich", "Fiktive Umsätze"], p: { i: ["Befragung Grundsätze/Abgrenzung Umsätze"], a: ["Vergleich Umsätze/Margen VJ"], d: ["Durchsicht Erlöskonten ungewöhnliche Buchungen"] } },
  personnel: { n: "Personalaufwand", c: "ER", r: ["Nicht erfasste SV-Beiträge", "Fehlerhafte Abgrenzung Boni"], p: { i: ["Besprechung Abweichungen VJ", "Befragung Prämien nach Stichtag"], a: ["Relation Saläre/Sozialleistungen VJ"], d: ["Abstimmung Lohnbuchhaltung Hauptbuch"] } },
  otherExp: { n: "Übriger betriebl. Aufwand", c: "ER", r: ["Unvollständige Periodenabgrenzung"], p: { i: ["Befragung Gründe Abweichungen"], a: ["Vergleich VJ"], d: ["Durchsicht hohe/ungewöhnliche Beträge"] } },
  finResult: { n: "Finanzaufwand/-ertrag", c: "ER", r: ["Fehlerhafte Kursgewinne/-verluste"], p: { i: ["Befragung Gründe Abweichungen"], a: ["Vergleich VJ", "Plausibilisierung mit verzinsl. Aktiven/Passiven"], d: ["Durchsicht ungewöhnliche Beträge"] } },
  extraord: { n: "Betriebsfremder/a.o. Aufwand & Ertrag", c: "ER", r: ["Falsche Klassierung", "Nicht offengelegte einmalige Posten"], p: { i: ["Besprechung Abweichungen VJ", "Identifikationskriterien"], a: ["Vergleich Salden/Kriterien VJ"], d: ["Abstimmung mit Belegen"] } },
  appendix: { n: "Anhang (Art. 959c OR)", c: "Offenlegung", r: ["Unvollständige Offenlegung", "Fehlende Pflichtangaben"], p: { i: ["Beteiligungen direkt/indirekt?", "Eigene Anteile?", "Nicht bilanzierte Leasing-/Mietverpflichtungen?", "VLL ggü. Vorsorgeeinrichtungen?", "Bürgschaften/Garantien/Pfandbestellungen?", "Eventualverbindlichkeiten?", "Stille Reserven – Methode & Veränderung?"], a: [], d: ["Offenlegung gem. Art. 959c OR vollständig?", "Angaben angewandte Grundsätze?", "Nettoauflösung stille Reserven?", "Vollzeitstellen (Grössenkategorie)?", "Forderungen/VLL ggü. Nahestehenden (Art. 959a Abs. 4)?"] } },
};

const OVERALL = {
  gc: { t: "Going Concern (SER Anhang G)", items: ["Rechnungslegung auf Fortführungsannahme?", "Zweifel an Fortführungsfähigkeit?", "Liquiditätsplanung beurteilt (12 Monate)?", "Kreditcovenants eingehalten?"] },
  events: { t: "Ereignisse nach Bilanzstichtag", items: ["Bedeutende schwebende Geschäfte?", "Verlustrisiken vor Stichtag?", "Offenlegung im Anhang korrekt?"] },
  overall: { t: "Gesamtbeurteilung (SER 6.2.4)", items: ["JR entspricht Verständnis Unternehmen?", "Schlüsse Einzelprüfungen erhärtet?", "GoR Art. 958c OR eingehalten?", "Gesetzl. Mindestinhalt gewahrt?", "Nicht korrigierte Fehler beurteilt?", "Stille Reserven plausibilisiert?"] },
  ve: { t: "Vollständigkeitserklärung (Anhang E)", items: ["VE eingeholt und unterzeichnet?", "Unterzeichnung VR-Präsident + RL-Verantwortliche?", "Datum = Datum Revisionsbericht?"] },
  first: { t: "Erstprüfung (SER 6.2.7)", items: ["Vorjahresrechnung geprüft? Von wem?", "Vorjahresbestände keine wesentl. Fehlaussagen?", "Dieselben RL-Grundsätze?", "Abstimmung Vortrag Vorjahresbestände?"] },
  cap: { t: "Kapitalverlust / Überschuldung (SER Kap. 9)", items: ["Hälftiger Kapitalverlust (Art. 725a OR)?", "Überschuldung (Art. 725b OR)?", "VR auf Pflichten aufmerksam gemacht?", "Anzeigepflicht Art. 729c OR beachtet?"] },
};

const REPORT_TYPES = [
  { id: "clean", l: "Nicht modifizierte Prüfungsaussage", d: "Keine Sachverhalte (Beispiel 1, Anhang F)" },
  { id: "qualified", l: "Eingeschränkte Prüfungsaussage", d: "Festgestellter Sachverhalt (Beispiel 2/4)" },
  { id: "adverse", l: "Verneinende Prüfungsaussage", d: "Grundlegende Veränderung Gesamtbild (Beispiel 3)" },
  { id: "disclaimer", l: "Keine Prüfungsaussage", d: "Keine Zusicherung möglich (Beispiel 5/7)" },
];

function calcMat(d) {
  const o = [];
  if (d.pbt > 0) o.push({ b: "Gewinn v. Steuern", v: d.pbt, lo: Math.round(d.pbt * .05), hi: Math.round(d.pbt * .10), r: "5–10%", rec: true, reason: "Übliche Bezugsgrösse (SER 5.2)" });
  if (d.rev) o.push({ b: "Umsatz", v: d.rev, lo: Math.round(d.rev * .005), hi: Math.round(d.rev * .01), r: "0.5–1%", rec: !d.pbt || d.pbt <= 0, reason: "Geeignet bei Verlust" });
  if (d.ta) o.push({ b: "Bilanzsumme", v: d.ta, lo: Math.round(d.ta * .01), hi: Math.round(d.ta * .02), r: "1–2%", rec: false, reason: "Alternative" });
  if (d.eq > 0) o.push({ b: "Eigenkapital", v: d.eq, lo: Math.round(d.eq * .02), hi: Math.round(d.eq * .05), r: "2–5%", rec: false, reason: "Kapitalintensiv" });
  const p = o.find(x => x.rec) || o[0] || { lo: 0 };
  return { o, p, tol: Math.round(p.lo * .65), triv: Math.round(p.lo * .05) };
}

// ── PDF extraction via Claude API ─────────────────────────────────
async function extractFromPdf(base64, mediaType) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 4000,
      messages: [{ role: "user", content: [
        { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: `Analysiere diese Schweizer Jahresrechnung (Bilanz und Erfolgsrechnung). Antworte NUR mit JSON, ohne Backticks:
{"balance":{"assets":[{"position":"...","current":0,"prior":0}],"liabilities":[{"position":"...","current":0,"prior":0}]},"income":{"items":[{"position":"...","current":0,"prior":0}]}}
Beträge Ganzzahlen CHF. Aufwand negativ. Eigenkapital in liabilities. prior weglassen wenn nicht vorhanden.` }
      ] }]
    })
  });
  const data = await r.json();
  const txt = data.content?.map(c => c.text || "").join("") || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

// ── AI Company Research via Claude API + Web Search ───────────────
async function researchCompany(companyName, website) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: `Du bist ein Schweizer Revisionsexperte und recherchierst Informationen über das Unternehmen "${companyName}"${website ? ` (Website: ${website})` : ""} für die Planung einer eingeschränkten Revision nach SER 2022.

Suche im Handelsregister (zefix.ch), auf der Firmenwebsite und weiteren öffentlichen Quellen. Antworte NUR mit JSON, ohne Backticks:

{
  "industry": "Branche und Geschäftsmodell in 1-2 Sätzen",
  "legalForm": "Rechtsform gemäss Handelsregister (z.B. AG, GmbH, Stiftung)",
  "location": "Sitz und ggf. weitere Standorte",
  "owners": "Eigentümerstruktur, sofern öffentlich bekannt (z.B. aus HR oder Website)",
  "relatedParties": "Organe (VR/GL-Mitglieder aus HR), Beteiligungen, nahestehende Personen/Gesellschaften",
  "accounting": "Vermutetes Rechnungswesen basierend auf Grösse/Branche (z.B. 'Vermutlich externe Buchhaltung bei KMU dieser Grösse')",
  "keyRisks": "Wesentliche Geschäftsrisiken basierend auf Branche und Unternehmensprofil",
  "special": "Besonderheiten des Unternehmens (z.B. regulatorische Anforderungen, Branchenspezifika)",
  "changes": "Falls bekannt: wesentliche Veränderungen (neue Einträge im HR, Kapitalveränderungen etc.), sonst 'Keine Informationen verfügbar - beim Mandanten zu erfragen'",
  "hrNumber": "CH-Nummer aus Handelsregister, falls gefunden",
  "uid": "UID-Nummer, falls gefunden",
  "purpose": "Zweck gemäss Handelsregister, falls gefunden",
  "capital": "Kapital gemäss Handelsregister, falls gefunden",
  "organs": "VR-Mitglieder / Geschäftsführung mit Zeichnungsberechtigung, falls gefunden"
}

Fülle alle Felder so gut wie möglich aus. Wenn eine Information nicht auffindbar ist, schreibe 'Nicht öffentlich verfügbar - beim Mandanten zu erfragen'.` }]
    })
  });
  const data = await r.json();
  const texts = data.content?.filter(c => c.type === "text").map(c => c.text) || [];
  const txt = texts.join("");
  try {
    return JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch {
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Konnte Recherche-Ergebnis nicht parsen");
  }
}

// ── AI Risk Assessment via Claude API ─────────────────────────────
async function assessRisks(companyName, understanding, financialData) {
  const balInfo = financialData?.balance ? JSON.stringify(financialData.balance) : "nicht verfügbar";
  const incInfo = financialData?.income ? JSON.stringify(financialData.income) : "nicht verfügbar";
  const undInfo = JSON.stringify(understanding || {});
  
  const areaNames = Object.entries(AREAS).map(([k, a]) => `"${k}": "${a.n}"`).join(", ");
  
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 4000,
      messages: [{ role: "user", content: `Du bist ein Schweizer Revisionsexperte. Beurteile das inhärente Risiko für die eingeschränkte Revision von "${companyName}" gemäss SER 2022, Kapitel 3.3.

Unternehmensverständnis: ${undInfo}
Bilanz: ${balInfo}
Erfolgsrechnung: ${incInfo}

Prüfgebiete: {${areaNames}}

Antworte NUR mit JSON, ohne Backticks. Für jedes Prüfgebiet (key): Risikostufe und Begründung.

{"assessments": {
  "cash": {"level": "normal", "reasoning": "Begründung in 1-2 Sätzen..."},
  ...für alle keys...
},
"overallRisk": "Gesamteinschätzung in 2-3 Sätzen",
"focusAreas": ["key1", "key2", ...die 3-5 Prüfgebiete mit erhöhtem Fokus],
"goingConcernRisk": "Einschätzung Going Concern in 1-2 Sätzen"
}

Risikostufen: "vernachlässigbar", "normal", "erhöht". Berücksichtige: Komplexität, Ermessensspielräume, Anfälligkeit auf Wertschwankungen, Abhängigkeit von zukünftigen Ereignissen, Wesentlichkeit der Position, branchenspezifische Risiken.` }]
    })
  });
  const data = await r.json();
  const txt = data.content?.filter(c => c.type === "text").map(c => c.text).join("") || "";
  try {
    return JSON.parse(txt.replace(/```json|```/g, "").trim());
  } catch {
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Risikobeurteilung konnte nicht geparst werden");
  }
}

// ── Reusable Components ───────────────────────────────────────────
function Check({ text, user }) {
  const [val, setVal] = useState(null); // null = offen, true = ja, false = nein
  const [stamp, setStamp] = useState(null);

  const handleClick = (v) => {
    setVal(v);
    setStamp({ user: user || "–", time: new Date() });
  };

  return (
    <div style={{ padding: "8px 0", borderBottom: `1px solid #f1f5f9` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: S.mid }}>{text}</span>
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          <button onClick={() => handleClick(true)} style={{
            padding: "4px 12px", borderRadius: "4px 0 0 4px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: S.font, transition: "all .1s",
            background: val === true ? S.green : S.surface, color: val === true ? "white" : S.muted,
            border: `1px solid ${val === true ? S.green : S.border}`
          }}>Ja</button>
          <button onClick={() => handleClick(false)} style={{
            padding: "4px 12px", borderRadius: "0 4px 4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: S.font, transition: "all .1s",
            background: val === false ? S.red : S.surface, color: val === false ? "white" : S.muted,
            border: `1px solid ${val === false ? S.red : S.border}`
          }}>Nein</button>
        </div>
      </div>
      {stamp && <div style={{ marginTop: 4, fontSize: 10, color: S.hint, fontFamily: S.mono, paddingLeft: 0 }}>
        {stamp.user} · {stamp.time.toLocaleDateString("de-CH")} {stamp.time.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </div>}
    </div>
  );
}

function Card({ title, color, children }) {
  const c = { amber: [S.amberL, S.amberB, S.amber], green: [S.greenL, S.greenB, S.green], red: [S.redL, S.redB, S.red], blue: [S.blueL, S.blueB, S.blue] }[color] || [S.surface, S.border, S.slate];
  return <div style={{ ...crd(), background: c[0], borderColor: c[1] }}><div style={{ fontSize: 14, fontWeight: 600, color: c[2], marginBottom: 10 }}>{title}</div>{children}</div>;
}

function AreaRow({ area, expanded, onToggle, risk, onRisk, user }) {
  const [files, setFiles] = useState([]);
  const fRef = useRef(null);
  const addFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFiles(prev => [...prev, { name: f.name, size: f.size, type: f.type, data: reader.result, addedBy: user, addedAt: new Date() }]);
    reader.readAsDataURL(f);
  };
  return (
    <div style={{ border: `1px solid ${S.border}`, borderRadius: 8, marginBottom: 5, background: S.surface, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: expanded ? S.bg : S.surface }}>
        <span style={{ fontSize: 16, color: S.hint, transform: expanded ? "rotate(180deg)" : "none", transition: ".2s" }}>▾</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: S.slate }}>{area.n}</span>
        {files.length > 0 && <span style={{ fontSize: 10, padding: "2px 7px", background: S.blueL, color: S.blue, borderRadius: 3, fontWeight: 600 }}>{files.length} Beleg(e)</span>}
        <span style={{ fontSize: 10, color: S.hint, marginRight: 6 }}>{area.c}</span>
        <select value={risk || "normal"} onChange={e => { e.stopPropagation(); onRisk(e.target.value); }} onClick={e => e.stopPropagation()} style={{ padding: "2px 6px", border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 10, background: risk === "erhöht" ? S.redL : risk === "vernachlässigbar" ? S.greenL : S.bg }}>
          {RISK_LVL.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {expanded && <div style={{ padding: "0 14px 14px" }}>
        <div style={{ marginBottom: 8 }}><div style={secT()}>Risiken</div>{area.r.map((r, i) => <div key={i} style={{ padding: "2px 0", fontSize: 12, color: "#991b1b" }}>⚠ {r}</div>)}</div>
        <div style={{ marginBottom: 8 }}><div style={secT()}>Prüfungsziele</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{OBJECTIVES.map(o => <label key={o} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: S.muted, padding: "2px 6px", background: S.bg, borderRadius: 3, border: `1px solid ${S.border}`, cursor: "pointer" }}><input type="checkbox" defaultChecked style={{ accentColor: S.slate }} />{o}</label>)}</div></div>
        {[{ l: "💬 Befragungen", items: area.p.i }, { l: "📊 Analytische PH", items: area.p.a }, { l: "🔍 Detailprüfungen", items: area.p.d }].filter(s => s.items.length).map((s, i) => <div key={i} style={{ marginBottom: 8 }}><div style={secT()}>{s.l}</div>{s.items.map((t, j) => <Check key={j} text={t} user={user} />)}</div>)}
        
        {/* Bemerkungen + Prüfdokumente */}
        <div style={{ marginTop: 8, padding: "12px", background: S.bg, borderRadius: 6 }}>
          <div style={secT()}>Bemerkungen / Schlussfolgerung</div>
          <textarea placeholder="Feststellungen, Verweise, Schlussfolgerung..." style={{ width: "100%", minHeight: 44, padding: 7, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box", background: "white" }} />
          
          <div style={{ ...secT(), marginTop: 12 }}>Prüfdokumente / Belege</div>
          <input ref={fRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc,.csv,.txt" multiple style={{ display: "none" }} onChange={e => { Array.from(e.target.files).forEach(addFile); e.target.value = ""; }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "white", borderRadius: 5, border: `1px solid ${S.border}`, fontSize: 11 }}>
                <span style={{ color: S.blue, fontWeight: 600 }}>{f.type?.includes("pdf") ? "PDF" : f.type?.includes("image") ? "IMG" : f.type?.includes("sheet") || f.type?.includes("excel") ? "XLS" : "DOC"}</span>
                <span style={{ color: S.mid, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <span style={{ color: S.hint, fontSize: 10 }}>{(f.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: S.red, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={() => fRef.current?.click()} style={{ ...btnSm(S.surface, S.muted), border: `1px solid ${S.border}`, fontSize: 11, padding: "5px 12px" }}>+ Beleg hinzufügen</button>
          {files.length > 0 && <div style={{ fontSize: 10, color: S.hint, marginTop: 6 }}>{files.map(f => `${f.name} (${f.addedBy}, ${f.addedAt.toLocaleDateString("de-CH")})`).join(" · ")}</div>}
        </div>
      </div>}
    </div>
  );
}

function FT({ title, items, mat }) {
  if (!items?.length) return null;
  return <div style={{ marginBottom: 18 }}>
    <div style={secT()}>{title}</div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr style={{ borderBottom: `2px solid ${S.slate}` }}><th style={{ textAlign: "left", padding: "5px 8px", color: S.muted }}>Position</th><th style={{ textAlign: "right", padding: "5px 8px", color: S.muted }}>Aktuell</th><th style={{ textAlign: "right", padding: "5px 8px", color: S.muted }}>Vorjahr</th><th style={{ textAlign: "right", padding: "5px 8px", color: S.muted }}>Δ</th></tr></thead>
      <tbody>{items.map((it, i) => { const ch = it.prior ? ((it.current - it.prior) / Math.abs(it.prior) * 100) : 0; const big = Math.abs(ch) > 20; const sig = Math.abs(it.current) >= (mat || Infinity); return (
        <tr key={i} style={{ borderBottom: `1px solid ${S.border}`, background: sig ? S.blueL : "transparent" }}>
          <td style={{ padding: "7px 8px", fontWeight: sig ? 600 : 400 }}>{it.position}</td>
          <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11 }}>{fmt(it.current)}</td>
          <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11, color: S.muted }}>{fmt(it.prior)}</td>
          <td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11, color: big ? S.red : S.muted, fontWeight: big ? 600 : 400 }}>{it.prior ? `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%` : "–"}</td>
        </tr>); })}</tbody>
    </table>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════════

// ── Login ─────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.bg, fontFamily: S.font }}>
      <div style={{ width: 360, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "white", fontWeight: 700 }}>R</div>
          <span style={{ fontSize: 19, fontWeight: 700, color: S.dark }}>Revisionsassistent</span>
        </div>
        <div style={crd()}>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.slate, marginBottom: 16 }}>Anmelden</div>
          <div style={{ marginBottom: 14 }}><div style={lbl()}>E-Mail</div><input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && email.includes("@") && onLogin(email)} placeholder="name@kanzlei.ch" style={inp()} /></div>
          <button onClick={() => email.includes("@") && onLogin(email)} style={{ ...btnP(!email.includes("@")), width: "100%" }}>Anmelden</button>
        </div>
        <div style={{ fontSize: 11, color: S.hint, marginTop: 12 }}>Prototyp · SER 2022</div>
      </div>
    </div>
  );
}

// ── Mandantenübersicht ────────────────────────────────────────────
function MandantenScreen({ mandanten, onCreate, onSelect, onSettings, user }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: S.dark, margin: 0 }}>Mandanten</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowNew(true)} style={btnSm()}>+ Neuer Mandant</button>
          <button onClick={onSettings} style={btnSm(S.surface, S.muted)} title="Einstellungen">⚙</button>
        </div>
      </div>
      {showNew && <div style={crd()}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><div style={lbl()}>Firmenname</div><input value={name} onChange={e => setName(e.target.value)} placeholder="Muster AG" style={inp()} /></div>
          <div><div style={lbl()}>Website</div><input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.muster.ch" style={inp()} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { if (name) { onCreate({ name, website }); setShowNew(false); setName(""); setWebsite(""); } }} style={btnSm()}>Anlegen</button>
          <button onClick={() => setShowNew(false)} style={btnSm(S.surface, S.muted)}>Abbrechen</button>
        </div>
      </div>}
      {mandanten.length === 0 && !showNew && <div style={{ ...crd(), textAlign: "center", padding: 48, color: S.hint }}>Noch keine Mandanten. Erstellen Sie Ihren ersten Mandanten.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {mandanten.map((m, i) => (
          <div key={i} onClick={() => onSelect(m)} style={{ ...crd(), cursor: "pointer", marginBottom: 0, transition: "border-color .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = S.blue} onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
            <div style={{ fontSize: 15, fontWeight: 600, color: S.slate }}>{m.name}</div>
            <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{m.website || "–"}</div>
            <div style={{ fontSize: 11, color: S.hint, marginTop: 8 }}>{m.years?.length || 0} Jahr(e) · Mandatsleiter: {m.mandatsleiter_email || "–"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Jahresübersicht pro Mandant ───────────────────────────────────
function JahreScreen({ mandant, onBack, onSelectYear, onCreateYear }) {
  const [newYear, setNewYear] = useState("2025");
  const [newType, setNewType] = useState("Eingeschränkte Revision nach Art. 729 ff. OR");
  return (
    <div>
      <button onClick={onBack} style={{ ...btnSm(S.surface, S.muted), marginBottom: 16 }}>← Alle Mandanten</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: S.dark, margin: 0 }}>{mandant.name}</h2>
          <div style={{ fontSize: 13, color: S.muted }}>{mandant.website}</div>
        </div>
      </div>
      <div style={crd()}>
        <div style={{ fontSize: 14, fontWeight: 600, color: S.slate, marginBottom: 10 }}>Neues Revisionsjahr anlegen</div>
        <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
          <div><div style={lbl()}>Geschäftsjahr</div><input value={newYear} onChange={e => setNewYear(e.target.value)} style={{ ...inp(), width: 100 }} /></div>
          <div style={{ flex: 1 }}><div style={lbl()}>Art des Auftrags</div><select value={newType} onChange={e => setNewType(e.target.value)} style={inp()}><option>Eingeschränkte Revision nach Art. 729 ff. OR</option><option>Eingeschränkte Revision nach Art. 727a OR</option><option>Freiwillige eingeschränkte Revision</option></select></div>
          <button onClick={() => onCreateYear({ year: newYear, type: newType })} style={btnSm()}>Anlegen</button>
        </div>
      </div>
      <div style={{ ...secT(), marginTop: 20 }}>Revisionsjahre</div>
      {(!mandant.years || mandant.years.length === 0) && <div style={{ ...crd(), textAlign: "center", padding: 32, color: S.hint }}>Noch kein Revisionsjahr angelegt.</div>}
      {mandant.years?.map((y, i) => (
        <div key={i} onClick={() => onSelectYear(y)} style={{ ...crd(), cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = S.blue} onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: S.slate }}>GJ {y.year}</span>
            <span style={{ fontSize: 12, color: S.muted, marginLeft: 12 }}>{y.audit_type || y.type}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: y.status === "abgeschlossen" ? S.greenL : y.status === "archiviert" ? "#f1f5f9" : S.blueL, color: y.status === "abgeschlossen" ? S.green : y.status === "archiviert" ? S.hint : S.blue }}>{y.status?.replace("_", " ") || "in Bearbeitung"}</span>
            <span style={{ fontSize: 12, color: S.hint }}>Schritt {(y.current_step || y.step || 0) + 1}/8</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────
function SettingsScreen({ onBack, mandant, onUpdate, onInvite }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [ml, setMl] = useState(mandant?.mandatsleiter_email || mandant?.mandatsleiter || "");
  const team = mandant?.team || [];
  return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={onBack} style={{ ...btnSm(S.surface, S.muted), marginBottom: 16 }}>← Zurück</button>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: S.dark, marginBottom: 20 }}>Einstellungen{mandant ? ` · ${mandant.name}` : ""}</h2>
      {mandant && <>
        <Card title="Mandatsleiter">
          <div style={{ fontSize: 12, color: S.muted, marginBottom: 8 }}>Erhält Hilferuf-Benachrichtigungen per E-Mail.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={ml} onChange={e => setMl(e.target.value)} placeholder="revisor@kanzlei.ch" style={{ ...inp(), flex: 1 }} />
            <button onClick={() => onUpdate({ ...mandant, mandatsleiter_email: ml })} style={btnSm()}>Speichern</button>
          </div>
        </Card>
        <Card title="Team einladen">
          <div style={{ fontSize: 12, color: S.muted, marginBottom: 8 }}>Mitarbeitende einladen, die an diesem Mandat arbeiten.</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="assistent@kanzlei.ch" style={{ ...inp(), flex: 1 }} />
            <button onClick={() => { if (inviteEmail.includes("@") && onInvite) { onInvite(inviteEmail); setInviteEmail(""); } }} style={btnSm()}>Einladen</button>
          </div>
          {team.map((t, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{t.email}</span>
              <span style={{ color: S.hint }}>{t.role}</span>
            </div>
          ))}
        </Card>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REVISION WORKFLOW (8 Steps)
// ═══════════════════════════════════════════════════════════════════
function RevisionWorkflow({ mandant, year, onBack, onHilferuf, user }) {
  const [step, setStep] = useState(year.step || 0);
  const [fd, setFd] = useState(year.financialData || null);
  const [expanded, setExpanded] = useState({});
  const [risks, setRisks] = useState({});
  const [understanding, setUnder] = useState(year.understanding || {});
  const [reportType, setRT] = useState("clean");
  const [uploading, setUploading] = useState(false);
  const [uploadSec, setUploadSec] = useState(0);
  const [uploadErr, setUploadErr] = useState(null);
  const [researching, setResearching] = useState(false);
  const [researchDone, setResearchDone] = useState(!!year.understanding?.industry);
  const [researchErr, setResearchErr] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(year.companyInfo || null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [assessingRisk, setAssessingRisk] = useState(false);
  const [riskErr, setRiskErr] = useState(null);
  // Digital document signatures
  const [auftragsbestEmail, setAuftragsbestEmail] = useState("");
  const [auftragsbestSig, setAuftragsbestSig] = useState(null);
  const [honorar, setHonorar] = useState("3'200");
  const [honorarFolge, setHonorarFolge] = useState("3'200");
  const [showABPreview, setShowABPreview] = useState(false);
  const [veEmail, setVeEmail] = useState("");
  const [veSig, setVeSig] = useState(null);
  const [jrEmail, setJrEmail] = useState("");
  const [jrSig, setJrSig] = useState(null);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  const sendDocEmail = (type, email, setSignature) => {
    if (!email.includes("@")) return;
    // Simulate sending + immediate confirmation for prototype
    const sig = {
      email,
      timestamp: new Date().toISOString(),
      ip: "192.168.1." + Math.floor(Math.random() * 255),
      hash: "SHA256:" + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join("")
    };
    setSignature(sig);
    const labels = { auftragsbestaetigung: "Auftragsbestätigung", ve: "Vollständigkeitserklärung", jr: "Jahresrechnung" };
    alert(`E-Mail gesendet an ${email}\n\nBetreff: ${labels[type]} – ${mandant.name} (GJ ${year.year})\n\nDer Empfänger erhält einen Bestätigungslink.\nNach Bestätigung wird die digitale Signatur dokumentiert.\n\n(Prototyp: Signatur sofort simuliert)`);
  };

  // Auto-research on mount if not done yet
  useEffect(() => {
    if (!researchDone && mandant.name && !researching) {
      doResearch();
    }
  }, []);

  const doResearch = async () => {
    setResearching(true); setResearchErr(null);
    try {
      const result = await researchCompany(mandant.name, mandant.website);
      setCompanyInfo(result);
      setUnder({
        industry: result.industry || "",
        legalForm: result.legalForm || "",
        location: result.location || "",
        owners: result.owners || "",
        relatedParties: result.relatedParties || "",
        accounting: result.accounting || "",
        keyRisks: result.keyRisks || "",
        special: result.special || "",
        changes: result.changes || "",
      });
      setResearchDone(true);
    } catch (e) {
      console.error(e);
      setResearchErr("Recherche fehlgeschlagen: " + e.message);
    } finally {
      setResearching(false);
    }
  };

  const doRiskAssessment = async () => {
    setAssessingRisk(true); setRiskErr(null);
    try {
      const result = await assessRisks(mandant.name, understanding, fd);
      setRiskAssessment(result);
      // Auto-set risk levels in Prüfprogramm
      if (result.assessments) {
        const newRisks = {};
        for (const [k, v] of Object.entries(result.assessments)) {
          if (v.level) newRisks[k] = v.level;
        }
        setRisks(prev => ({ ...prev, ...newRisks }));
      }
    } catch (e) {
      console.error(e);
      setRiskErr("Risikobeurteilung fehlgeschlagen: " + e.message);
    } finally {
      setAssessingRisk(false);
    }
  };

  const bal = fd?.balance; const inc = fd?.income;
  const tA = bal?.assets?.reduce((s, a) => s + (a.current || 0), 0) || 0;
  const tL = bal?.liabilities?.reduce((s, a) => s + (a.current || 0), 0) || 0;
  const revI = inc?.items?.find(i => /(erlös|umsatz|ertrag)/i.test(i.position || ""));
  const rev = revI?.current || 0;
  const taxI = inc?.items?.find(i => /steuer/i.test(i.position || "") && !/mwst/i.test(i.position || ""));
  const eqI = bal?.liabilities?.filter(i => /(kapital|reserve|gewinn|verlust)/i.test(i.position || "")) || [];
  const eq = eqI.reduce((s, a) => s + (a.current || 0), 0);
  const niI = bal?.liabilities?.filter(i => /jahres(gewinn|verlust)/i.test(i.position || "")) || [];
  const ni = niI.length > 0 ? niI.reduce((s, a) => s + (a.current || 0), 0) : 0;
  const pbt = taxI ? ni + Math.abs(taxI.current || 0) : ni;
  const mc = calcMat({ ta: tA, rev, pbt, eq });
  const mat = mc.p?.lo || 0;

  const handlePdf = async (file) => {
    if (!file) return;
    setUploading(true); setUploadErr(null); setUploadSec(0);
    timerRef.current = setInterval(() => setUploadSec(s => s + 1), 1000);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      const result = await extractFromPdf(b64, file.type || "application/pdf");
      setFd(result);
    } catch (e) { setUploadErr(`Fehler: ${e.message}`); }
    finally { clearInterval(timerRef.current); setUploading(false); }
  };

  const steps = ["Ausgangslage", "Unabhängigkeit", "Unternehmen", "Jahresrechnung", "Wesentlichkeit", "Prüfprogramm", "Übergreifend", "Bericht"];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
      {/* Sidebar */}
      <div style={{ width: 210, background: S.bg, borderRight: `1px solid ${S.border}`, padding: "16px 0", flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <button onClick={onBack} style={{ ...btnSm(S.surface, S.muted), margin: "0 12px 12px", fontSize: 11, padding: "6px 10px" }}>← {mandant.name}</button>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 14px", background: step === i ? S.surface : "transparent", border: "none", borderRight: step === i ? `2px solid ${S.slate}` : "2px solid transparent", cursor: "pointer", fontSize: 11, fontWeight: step === i ? 600 : 400, color: step === i ? S.slate : S.muted, textAlign: "left", fontFamily: S.font }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: step === i ? S.slate : i < step ? "#86efac" : "#e2e8f0", color: step === i ? "white" : i < step ? "#166534" : S.hint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{i < step ? "✓" : i + 1}</span>
            {s}
          </button>
        ))}
        {fd && <div style={{ padding: "12px 14px", marginTop: "auto", borderTop: `1px solid ${S.border}`, fontSize: 11 }}>
          <div style={{ color: S.slate, fontWeight: 500 }}>Mat: CHF {fmt(mat)}</div>
          <div style={{ color: S.hint }}>Tol: CHF {fmt(mc.tol)}</div>
        </div>}
        {/* Hilferuf */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${S.border}` }}>
          <button onClick={onHilferuf} style={{ width: "100%", padding: "9px", background: S.redL, color: S.red, border: `1px solid ${S.redB}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: S.font }}>🚨 Hilferuf an Mandatsleiter</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>

        {/* 0: AUSGANGSLAGE */}
        {step === 0 && <div style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Ausgangslage · GJ {year.year}</h2>
          <div style={{ ...crd() }}>
            <div style={{ fontSize: 13, color: S.mid, marginBottom: 4 }}><strong>{mandant.name}</strong> · {mandant.website || "–"}</div>
            <div style={{ fontSize: 12, color: S.muted }}>{year.type}</div>
          </div>
          <Card title="Jahresrechnung hochladen">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>PDF der Jahresrechnung (Bilanz + Erfolgsrechnung) hochladen – die Positionen werden automatisch erkannt.</div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={e => handlePdf(e.target.files[0])} />
            {uploading ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${S.border}`, borderTopColor: S.slate, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 13, color: S.mid }}>Wird analysiert… {uploadSec}s</div>
                <button onClick={() => { clearInterval(timerRef.current); setUploading(false); }} style={{ ...btnSm(S.surface, S.red), marginTop: 10, border: `1px solid ${S.redB}` }}>Abbrechen</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} style={btnSm()}>PDF auswählen</button>
                {fd && <span style={{ fontSize: 12, color: S.green, fontWeight: 500, display: "flex", alignItems: "center" }}>✓ Geladen ({bal?.assets?.length || 0}A / {bal?.liabilities?.length || 0}P / {inc?.items?.length || 0}ER)</span>}
              </div>
            )}
            {uploadErr && <div style={{ marginTop: 8, fontSize: 12, color: S.red }}>{uploadErr}</div>}
          </Card>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => setStep(1)} style={btnP(false)}>Weiter →</button>
          </div>
        </div>}

        {/* 1: UNABHÄNGIGKEIT */}
        {step === 1 && <div style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Unabhängigkeit & Mandatsannahme</h2>
          <Card title="Unabhängigkeit (SER 1.3 / Anhang B)">{INDEP_CHECKS.map((c, i) => <Check key={i} text={c} user={user} />)}<textarea placeholder="Bemerkungen..." style={{ width: "100%", minHeight: 40, padding: 7, marginTop: 8, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box" }} /></Card>
          <Card title="Mandatsannahme (SER 1.4)">{ACCEPT_CHECKS.map((c, i) => <Check key={i} text={c} user={user} />)}<textarea placeholder="Bemerkungen..." style={{ width: "100%", minHeight: 40, padding: 7, marginTop: 8, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box" }} /></Card>
          
          {/* Auftragsbestätigung */}
          <Card title="Auftragsbestätigung (SER 1.7 / Anhang C)" color="blue">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 12, lineHeight: 1.6 }}>
              Automatisch generiert aus Mandatsdaten. Nur das Honorar muss individuell angepasst werden.
            </div>

            {/* Honorar – einziges manuelles Feld */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><div style={lbl()}>Honorar erstes Jahr (CHF)</div><input value={honorar} onChange={e => setHonorar(e.target.value)} style={{ ...inp(), background: "#fff8e1" }} /></div>
              <div><div style={lbl()}>Honorar Folgejahre (CHF)</div><input value={honorarFolge} onChange={e => setHonorarFolge(e.target.value)} style={{ ...inp(), background: "#fff8e1" }} /></div>
            </div>

            {/* Document Preview Toggle */}
            <button onClick={() => setShowABPreview(!showABPreview)} style={{ ...btnSm(S.surface, S.blue), border: `1px solid ${S.blueB}`, marginBottom: showABPreview ? 12 : 0, fontSize: 12 }}>
              {showABPreview ? "Vorschau ausblenden" : "Dokumentvorschau anzeigen"}
            </button>

            {showABPreview && <div style={{ padding: "20px 24px", background: "white", border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 12, lineHeight: 1.7, color: S.mid, marginBottom: 14, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{mandant.name}</div>
              <div style={{ color: S.muted, marginBottom: 16 }}>{companyInfo?.organs ? companyInfo.organs.split(",")[0] : "Verwaltungsrat"}<br/>{companyInfo?.location || mandant.website || "–"}</div>
              <div style={{ color: S.muted, marginBottom: 20 }}>{new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: S.dark }}>Auftragsbestätigung</div>
              <div style={{ marginBottom: 12 }}>An den Verwaltungsrat der <strong>{mandant.name}</strong></div>
              <div style={{ marginBottom: 12 }}>Die Generalversammlung Ihrer Gesellschaft hat uns als Revisionsstelle im Sinne des Obligationenrechts (Art. 727ff. OR) der {mandant.name} gewählt oder beabsichtigt uns zu wählen. Gerne erklären wir die Annahme dieser Wahl und legen Ihnen dar, wie wir den Auftrag zur Vornahme einer Eingeschränkten Revision der Jahresrechnung nach OR für das am 31. Dezember {year.year} abgeschlossene Geschäftsjahr verstehen.</div>
              <div style={{ marginBottom: 12 }}>Diese Auftragsbestätigung gilt auch für die Revision in den nachfolgenden Jahren, sofern das Revisionsmandat verlängert und keine neue Auftragsbestätigung vereinbart wird.</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>1. Ziel und Grundsätze der Eingeschränkten Revision</div>
              <div style={{ marginBottom: 12 }}>Die Eingeschränkte Revision erfolgt mit dem Ziel einer Aussage darüber, ob wir auf Sachverhalte gestossen sind, die uns zum Schluss veranlassen, dass die Jahresrechnung sowie der Antrag über die Verwendung des Bilanzgewinnes nach OR nicht in allen wesentlichen Punkten Gesetz und Statuten entsprechen.</div>
              <div style={{ marginBottom: 12 }}>Für die Erstellung der Jahresrechnung nach OR ist der Verwaltungsrat verantwortlich. Diese Verantwortung beinhaltet auch eine ordnungsmässige Buchführung, eine angemessene interne Kontrolle, die Auswahl und Anwendung von Regeln ordnungsmässiger Rechnungslegung und die Sicherung der Vermögenswerte des Unternehmens.</div>
              <div style={{ marginBottom: 12 }}>Wir werden diese Eingeschränkte Revision nach dem «Standard zur Eingeschränkten Revision» (SER 2022) vornehmen. Entsprechend dem Charakter der Eingeschränkten Revision ist der Umfang der Prüfungshandlungen geringer als bei einer Ordentlichen Revision.</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>2. Honorar</div>
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fff8e1", borderRadius: 4, border: `1px solid ${S.amberB}` }}>Wir schätzen den Honorarbetrag auf <strong>CHF {honorar}</strong> im ersten Jahr und <strong>CHF {honorarFolge}</strong> in den Folgejahren (zuzüglich Barauslagen und Mehrwertsteuer).</div>
              <div style={{ marginTop: 20, borderTop: `1px solid ${S.border}`, paddingTop: 12 }}>
                <div style={{ fontWeight: 500 }}>XELLENZ Revisionen GmbH</div>
                <div style={{ color: S.muted, marginTop: 8 }}>{new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>}

            {/* Send */}
            {auftragsbestSig ? (
              <div style={{ padding: "12px 16px", background: S.greenL, borderRadius: 6, border: `1px solid ${S.greenB}`, marginTop: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.green, marginBottom: 6 }}>✓ Digital bestätigt</div>
                <div style={{ fontSize: 11, color: S.mid, lineHeight: 1.6, fontFamily: S.mono }}>
                  <div>Bestätigt durch: {auftragsbestSig.email}</div>
                  <div>Zeitpunkt: {new Date(auftragsbestSig.timestamp).toLocaleString("de-CH")}</div>
                  <div>Hash: {auftragsbestSig.hash}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 10 }}>
                <div style={{ flex: 1 }}><div style={lbl()}>E-Mail Mandant (VR/GL)</div><input value={auftragsbestEmail} onChange={e => setAuftragsbestEmail(e.target.value)} placeholder="vr@mandant.ch" style={inp()} /></div>
                <button onClick={() => sendDocEmail("auftragsbestaetigung", auftragsbestEmail, setAuftragsbestSig)} style={{ ...btnSm(S.blue, "white"), padding: "10px 16px", whiteSpace: "nowrap" }}>✉ Senden & bestätigen lassen</button>
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(0)} style={btnS()}>←</button><button onClick={() => setStep(2)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 2: VERSTÄNDNIS */}
        {step === 2 && <div style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Verständnis & Risikobeurteilung</h2>
          
          {/* Research status */}
          {researching && <div style={{ ...crd(), background: S.blueL, borderColor: S.blueB, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 24, height: 24, border: `3px solid ${S.blueB}`, borderTopColor: S.blue, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: S.blue }}>KI recherchiert…</div><div style={{ fontSize: 12, color: S.muted }}>Handelsregister, Website und öffentliche Quellen werden durchsucht für «{mandant.name}»</div></div>
          </div>}
          {researchErr && <div style={{ ...crd(), background: S.redL, borderColor: S.redB }}>
            <div style={{ fontSize: 13, color: S.red, marginBottom: 8 }}>{researchErr}</div>
            <button onClick={doResearch} style={btnSm()}>Erneut versuchen</button>
          </div>}
          {researchDone && !researching && <div style={{ ...crd(), background: S.greenL, borderColor: S.greenB, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: S.green, fontWeight: 500 }}>✓ Unternehmensrecherche abgeschlossen – Felder automatisch ausgefüllt</div>
            <button onClick={doResearch} style={btnSm(S.surface, S.muted)}>Neu recherchieren</button>
          </div>}

          {/* Company info from HR if available */}
          {companyInfo && (companyInfo.hrNumber || companyInfo.uid || companyInfo.purpose) && <Card title="Handelsregister-Informationen">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
              {companyInfo.hrNumber && <div><span style={{ color: S.hint }}>HR-Nr:</span> <span style={{ color: S.mid, fontWeight: 500 }}>{companyInfo.hrNumber}</span></div>}
              {companyInfo.uid && <div><span style={{ color: S.hint }}>UID:</span> <span style={{ color: S.mid, fontWeight: 500 }}>{companyInfo.uid}</span></div>}
              {companyInfo.capital && <div><span style={{ color: S.hint }}>Kapital:</span> <span style={{ color: S.mid, fontWeight: 500 }}>{companyInfo.capital}</span></div>}
            </div>
            {companyInfo.purpose && <div style={{ marginTop: 8, fontSize: 12 }}><span style={{ color: S.hint }}>Zweck:</span> <span style={{ color: S.mid }}>{companyInfo.purpose}</span></div>}
            {companyInfo.organs && <div style={{ marginTop: 8, fontSize: 12 }}><span style={{ color: S.hint }}>Organe:</span> <span style={{ color: S.mid }}>{companyInfo.organs}</span></div>}
          </Card>}

          <Card title="Verständnis des Unternehmens (SER 3.1)">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>Automatisch aus Handelsregister, Website und öffentlichen Quellen befüllt. Bitte überprüfen und ergänzen.</div>
            {UNDERSTAND.map(f => <div key={f.k} style={{ marginBottom: 10 }}><div style={lbl()}>{f.l}</div><textarea value={understanding[f.k] || ""} onChange={e => setUnder(p => ({ ...p, [f.k]: e.target.value }))} rows={2} style={{ width: "100%", padding: 7, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box", background: understanding[f.k] ? "#f0fdf4" : "white" }} /></div>)}
          </Card>
          <Card title="Analytische PH Planung (SER 3.2)">
            {fd ? <div style={{ fontSize: 12, color: S.mid, lineHeight: 1.6 }}>Bilanzsumme: <strong>CHF {fmt(tA)}</strong> · Ertrag: <strong>CHF {fmt(rev)}</strong> · EK: <strong>CHF {fmt(eq)}</strong> ({tA ? (eq / tA * 100).toFixed(1) : "–"}%) · Ergebnis: <strong>CHF {fmt(ni)}</strong></div> : <div style={{ fontSize: 12, color: S.hint }}>JR noch nicht geladen.</div>}
            <textarea placeholder="Weitere Erkenntnisse, Kennzahlen, Branchenvergleiche..." style={{ width: "100%", minHeight: 44, padding: 7, marginTop: 8, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box" }} />
          </Card>

          {/* Risikobeurteilung (SER 3.3) */}
          <Card title="Risikobeurteilung – Inhärentes Risiko (SER 3.3)">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 12, lineHeight: 1.6 }}>
              Beurteilung des inhärenten Risikos pro Prüfgebiet basierend auf Unternehmensverständnis, Jahresrechnung und Branchenrisiken. Die KI analysiert automatisch und setzt die Risikostufen auch im Prüfprogramm (Schritt 6).
            </div>
            
            {!riskAssessment && !assessingRisk && (
              <button onClick={doRiskAssessment} disabled={!researchDone && !fd} style={{ ...btnSm(researchDone || fd ? S.slate : S.hint, "white"), padding: "10px 20px", marginBottom: 12 }}>
                {researchDone || fd ? "Risikobeurteilung generieren" : "Zuerst Recherche oder JR laden"}
              </button>
            )}

            {assessingRisk && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
              <div style={{ width: 22, height: 22, border: `2px solid ${S.blueB}`, borderTopColor: S.blue, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: S.blue }}>KI beurteilt inhärente Risiken…</span>
            </div>}

            {riskErr && <div style={{ fontSize: 12, color: S.red, marginBottom: 8 }}>{riskErr} <button onClick={doRiskAssessment} style={btnSm()}>Erneut</button></div>}

            {riskAssessment && <>
              {/* Gesamteinschätzung */}
              {riskAssessment.overallRisk && <div style={{ padding: "10px 14px", background: S.blueL, borderRadius: 6, border: `1px solid ${S.blueB}`, marginBottom: 14, fontSize: 12, color: S.mid, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, color: S.blue, marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>Gesamteinschätzung</div>
                {riskAssessment.overallRisk}
              </div>}

              {riskAssessment.goingConcernRisk && <div style={{ padding: "10px 14px", background: S.amberL, borderRadius: 6, border: `1px solid ${S.amberB}`, marginBottom: 14, fontSize: 12, color: S.mid, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, color: S.amber, marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>Going Concern</div>
                {riskAssessment.goingConcernRisk}
              </div>}

              {/* Risk Matrix */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 }}>
                <thead><tr style={{ borderBottom: `2px solid ${S.slate}` }}>
                  <th style={{ textAlign: "left", padding: "5px 8px", color: S.muted }}>Prüfgebiet</th>
                  <th style={{ textAlign: "center", padding: "5px 8px", color: S.muted, width: 100 }}>Risiko</th>
                  <th style={{ textAlign: "left", padding: "5px 8px", color: S.muted }}>Begründung</th>
                </tr></thead>
                <tbody>{Object.entries(AREAS).map(([k, a]) => {
                  const ra = riskAssessment.assessments?.[k];
                  const lv = ra?.level || "normal";
                  const isFocus = riskAssessment.focusAreas?.includes(k);
                  const lvColor = lv === "erhöht" ? { bg: S.redL, c: S.red } : lv === "vernachlässigbar" ? { bg: S.greenL, c: S.green } : { bg: "#f8fafc", c: S.muted };
                  return (
                    <tr key={k} style={{ borderBottom: `1px solid ${S.border}`, background: isFocus ? "#fef3c7" : "transparent" }}>
                      <td style={{ padding: "7px 8px", fontWeight: isFocus ? 600 : 400 }}>
                        {a.n}
                        {isFocus && <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", background: S.amberL, color: S.amber, borderRadius: 3, fontWeight: 600 }}>Fokus</span>}
                      </td>
                      <td style={{ textAlign: "center", padding: "7px 8px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: lvColor.bg, color: lvColor.c }}>{lv}</span>
                      </td>
                      <td style={{ padding: "7px 8px", fontSize: 11, color: S.muted }}>{ra?.reasoning || "–"}</td>
                    </tr>
                  );
                })}</tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: S.hint }}>Risikostufen werden automatisch ins Prüfprogramm übernommen.</div>
                <button onClick={doRiskAssessment} style={btnSm(S.surface, S.muted)}>Neu beurteilen</button>
              </div>
            </>}
          </Card>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(1)} style={btnS()}>←</button><button onClick={() => setStep(3)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 3: JAHRESRECHNUNG */}
        {step === 3 && <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Jahresrechnung</h2>
          {fd ? <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[{ l: "Bilanzsumme", v: fmt(tA) }, { l: "Ertrag", v: fmt(rev) }, { l: "Ergebnis", v: fmt(ni) }, { l: "Eigenkapital", v: fmt(eq), s: tA ? `${(eq / tA * 100).toFixed(1)}%` : "" }].map((c, i) => <div key={i} style={{ padding: "12px 14px", background: S.surface, borderRadius: 8, border: `1px solid ${S.border}` }}><div style={{ fontSize: 10, fontWeight: 600, color: S.hint, textTransform: "uppercase" }}>{c.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: S.dark, fontFamily: S.mono, marginTop: 2 }}>{c.v}</div>{c.s && <div style={{ fontSize: 10, color: S.muted }}>{c.s}</div>}</div>)}
            </div>
            <FT title="Aktiven" items={bal?.assets} mat={mat} />
            <FT title="Passiven" items={bal?.liabilities} mat={mat} />
            <FT title="Erfolgsrechnung" items={inc?.items} mat={mat} />
          </> : <div style={{ ...crd(), textAlign: "center", padding: 40, color: S.hint }}>JR noch nicht geladen – bitte unter Ausgangslage hochladen.</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(2)} style={btnS()}>←</button><button onClick={() => setStep(4)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 4: WESENTLICHKEIT */}
        {step === 4 && <div style={{ maxWidth: 780 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Wesentlichkeit (SER Kap. 5)</h2>
          {fd && mc.o.length > 0 ? <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}><thead><tr style={{ borderBottom: `2px solid ${S.slate}` }}><th style={{ textAlign: "left", padding: "5px 8px" }}>Basis</th><th style={{ textAlign: "right", padding: "5px 8px" }}>Wert</th><th style={{ textAlign: "center", padding: "5px 8px" }}>Band</th><th style={{ textAlign: "right", padding: "5px 8px" }}>Tief</th><th style={{ textAlign: "right", padding: "5px 8px" }}>Hoch</th><th></th></tr></thead><tbody>{mc.o.map((o, i) => <tr key={i} style={{ borderBottom: `1px solid ${S.border}`, background: o.rec ? S.blueL : "transparent" }}><td style={{ padding: "7px 8px", fontWeight: o.rec ? 600 : 400 }}>{o.b}</td><td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11 }}>{fmt(o.v)}</td><td style={{ textAlign: "center", padding: "7px 8px" }}>{o.r}</td><td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11 }}>{fmt(o.lo)}</td><td style={{ textAlign: "right", padding: "7px 8px", fontFamily: S.mono, fontSize: 11 }}>{fmt(o.hi)}</td><td style={{ textAlign: "center", padding: "7px 8px" }}>{o.rec && <span style={{ padding: "2px 7px", background: S.greenL, color: S.green, borderRadius: 3, fontSize: 10, fontWeight: 600 }}>Empf.</span>}</td></tr>)}</tbody></table>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, background: S.dark, borderRadius: 8, color: "white" }}><div style={{ fontSize: 10, color: S.hint, textTransform: "uppercase", fontWeight: 600 }}>Gesamtwesentlichkeit</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: S.mono, marginTop: 2 }}>CHF {fmt(mat)}</div></div>
              <div style={{ padding: 14, background: S.surface, borderRadius: 8, border: `1px solid ${S.border}` }}><div style={{ fontSize: 10, color: S.hint, textTransform: "uppercase", fontWeight: 600 }}>Toleranz</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: S.mono, marginTop: 2 }}>CHF {fmt(mc.tol)}</div><div style={{ fontSize: 10, color: S.hint }}>65%</div></div>
              <div style={{ padding: 14, background: S.surface, borderRadius: 8, border: `1px solid ${S.border}` }}><div style={{ fontSize: 10, color: S.hint, textTransform: "uppercase", fontWeight: 600 }}>Nichtaufgriff</div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: S.mono, marginTop: 2 }}>CHF {fmt(mc.triv)}</div><div style={{ fontSize: 10, color: S.hint }}>5%</div></div>
            </div>
            <Card title="Begründung"><div style={{ fontSize: 12, color: S.mid, marginBottom: 6 }}>{mc.p?.reason}</div><textarea placeholder="Qualitative Überlegungen..." style={{ width: "100%", minHeight: 40, padding: 7, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box" }} /></Card>
          </> : <div style={{ ...crd(), textAlign: "center", padding: 40, color: S.hint }}>JR noch nicht geladen.</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(3)} style={btnS()}>←</button><button onClick={() => setStep(5)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 5: PRÜFPROGRAMM */}
        {step === 5 && <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 4 }}>Prüfprogramm (SER Anhang D)</h2>
          <div style={{ fontSize: 11, color: S.hint, marginBottom: 16 }}>17 Prüfgebiete · Mat: CHF {fmt(mat)} · Tol: CHF {fmt(mc.tol)}</div>
          {Object.entries(AREAS).map(([k, a]) => <AreaRow key={k} area={a} expanded={expanded[k]} onToggle={() => setExpanded(p => ({ ...p, [k]: !p[k] }))} risk={risks[k]} onRisk={v => setRisks(p => ({ ...p, [k]: v }))} user={user} />)}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(4)} style={btnS()}>←</button><button onClick={() => setStep(6)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 6: ÜBERGREIFEND */}
        {step === 6 && <div style={{ maxWidth: 780 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Übergreifende Prüfungen & Fehlaussagen</h2>
          {Object.entries(OVERALL).map(([k, s]) => <Card key={k} title={s.t}>{s.items.map((t, i) => <Check key={i} text={t} user={user} />)}<textarea placeholder="Bemerkungen..." style={{ width: "100%", minHeight: 36, padding: 7, marginTop: 8, border: `1px solid ${S.border}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, boxSizing: "border-box" }} /></Card>)}

          {/* Vollständigkeitserklärung per E-Mail */}
          <Card title="Vollständigkeitserklärung einholen (SER Anhang E)" color="blue">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 10, lineHeight: 1.6 }}>
              Die Unternehmensleitung bestätigt die Vollständigkeit der JR sowie Richtigkeit der erteilten Auskünfte (Art. 730b Abs. 1 OR). Unterzeichnung durch VR-Präsident und RL-Verantwortliche. Datum = Datum Revisionsbericht.
            </div>
            {veSig ? (
              <div style={{ padding: "12px 16px", background: S.greenL, borderRadius: 6, border: `1px solid ${S.greenB}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.green, marginBottom: 6 }}>✓ Vollständigkeitserklärung digital bestätigt</div>
                <div style={{ fontSize: 11, color: S.mid, lineHeight: 1.6, fontFamily: S.mono }}>
                  <div>Bestätigt durch: {veSig.email}</div>
                  <div>Zeitpunkt: {new Date(veSig.timestamp).toLocaleString("de-CH")}</div>
                  <div>IP: {veSig.ip}</div>
                  <div>Hash: {veSig.hash}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                <div style={{ flex: 1 }}><div style={lbl()}>E-Mail VR-Präsident / GL</div><input value={veEmail} onChange={e => setVeEmail(e.target.value)} placeholder="vr-praesident@mandant.ch" style={inp()} /></div>
                <button onClick={() => sendDocEmail("ve", veEmail, setVeSig)} style={{ ...btnSm(S.blue, "white"), padding: "10px 16px", whiteSpace: "nowrap" }}>✉ VE senden</button>
              </div>
            )}
          </Card>

          {/* Jahresrechnung Freigabe per E-Mail */}
          <Card title="Jahresrechnung – Freigabe durch VR (Art. 958 Abs. 3 OR)" color="blue">
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 10, lineHeight: 1.6 }}>
              Die JR muss vom Vorsitzenden des obersten Leitungs-/Verwaltungsorgans und der für die Rechnungslegung zuständigen Person unterzeichnet bzw. formell gutgeheissen werden.
            </div>
            {jrSig ? (
              <div style={{ padding: "12px 16px", background: S.greenL, borderRadius: 6, border: `1px solid ${S.greenB}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.green, marginBottom: 6 }}>✓ Jahresrechnung digital freigegeben</div>
                <div style={{ fontSize: 11, color: S.mid, lineHeight: 1.6, fontFamily: S.mono }}>
                  <div>Freigegeben durch: {jrSig.email}</div>
                  <div>Zeitpunkt: {new Date(jrSig.timestamp).toLocaleString("de-CH")}</div>
                  <div>IP: {jrSig.ip}</div>
                  <div>Hash: {jrSig.hash}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                <div style={{ flex: 1 }}><div style={lbl()}>E-Mail VR-Präsident</div><input value={jrEmail} onChange={e => setJrEmail(e.target.value)} placeholder="vr-praesident@mandant.ch" style={inp()} /></div>
                <button onClick={() => sendDocEmail("jr", jrEmail, setJrSig)} style={{ ...btnSm(S.blue, "white"), padding: "10px 16px", whiteSpace: "nowrap" }}>✉ JR-Freigabe senden</button>
              </div>
            )}
          </Card>

          <Card title="Fehlaussagen-Zusammenstellung (SER 5.3)" color="amber"><textarea placeholder="Fehlaussage · Korrekturvorschlag · Auswirkung..." style={{ width: "100%", minHeight: 80, padding: 8, border: `1px solid ${S.amberB}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, background: "white", boxSizing: "border-box" }} /></Card>
          <Card title="Offene Punkte" color="amber"><textarea placeholder="Noch durchzuführende PH, einzuholende Unterlagen..." style={{ width: "100%", minHeight: 50, padding: 8, border: `1px solid ${S.amberB}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, background: "white", boxSizing: "border-box" }} /></Card>
          <Card title="Schlussbeurteilung" color="green"><textarea placeholder="Gesamtbeurteilung, Dokumentationsstand..." style={{ width: "100%", minHeight: 50, padding: 8, border: `1px solid ${S.greenB}`, borderRadius: 4, fontSize: 12, resize: "vertical", fontFamily: S.font, background: "white", boxSizing: "border-box" }} /></Card>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(5)} style={btnS()}>←</button><button onClick={() => setStep(7)} style={btnP(false)}>Weiter →</button></div>
        </div>}

        {/* 7: BERICHT */}
        {step === 7 && <div style={{ maxWidth: 780 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, marginBottom: 16 }}>Berichterstattung (SER Kap. 8)</h2>

          {/* Signatur-Übersicht */}
          <Card title="Dokumenten-Status">
            {[
              { l: "Auftragsbestätigung (Anhang C)", sig: auftragsbestSig },
              { l: "Vollständigkeitserklärung (Anhang E)", sig: veSig },
              { l: "Jahresrechnung-Freigabe (Art. 958 Abs. 3 OR)", sig: jrSig },
            ].map((d, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: S.mid }}>{d.l}</span>
                {d.sig ? (
                  <span style={{ padding: "3px 10px", background: S.greenL, color: S.green, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ {d.sig.email} · {new Date(d.sig.timestamp).toLocaleDateString("de-CH")}</span>
                ) : (
                  <span style={{ padding: "3px 10px", background: S.amberL, color: S.amber, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Ausstehend</span>
                )}
              </div>
            ))}
          </Card>

          <Card title="Art der Prüfungsaussage">{REPORT_TYPES.map(rt => <label key={rt.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: `1px solid ${S.border}`, cursor: "pointer" }}><input type="radio" name="rt" checked={reportType === rt.id} onChange={() => setRT(rt.id)} style={{ marginTop: 3 }} /><div><div style={{ fontSize: 13, fontWeight: 600, color: S.slate }}>{rt.l}</div><div style={{ fontSize: 11, color: S.muted }}>{rt.d}</div></div></label>)}</Card>
          <Card title="Elemente Revisionsbericht (Art. 729b OR)">{["Hinweis eingeschränkte Revision", "Stellungnahme Ergebnis", "Angaben Unabhängigkeit (inkl. Mitwirkung Buchführung)", "Name + Zulassung leitender Revisor", "Unterschrift leitender Revisor", "Berichtsdatum", "Ggf. Hinweise Gesetzesverstösse", "Ggf. Zusätze weitere Informationen"].map((c, i) => <Check key={i} text={c} user={user} />)}</Card>
          <div style={{ marginTop: 14, padding: 18, background: "#f1f5f9", borderRadius: 8, border: `1px solid ${S.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: S.slate, marginBottom: 6 }}>PDF-Export</div>
            <div style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>Vollständige Revisionsdokumentation – 8 Kapitel, inkl. digitale Signaturen.</div>
            <button onClick={() => {
              const today = new Date().toLocaleDateString("de-CH", {day:"numeric",month:"long",year:"numeric"});
              const sigRow = (label, sig) => sig ? `<tr><td>${label}</td><td style="color:green">✓ ${sig.email} · ${new Date(sig.timestamp).toLocaleString("de-CH")}</td></tr>` : `<tr><td>${label}</td><td style="color:#d97706">Ausstehend</td></tr>`;
              const finRows = (items) => items?.map(it => `<tr><td>${it.position}</td><td style="text-align:right;font-family:monospace">${fmt(it.current)}</td><td style="text-align:right;font-family:monospace;color:#888">${fmt(it.prior)}</td></tr>`).join("") || "";
              const areaRows = Object.entries(AREAS).map(([k,a]) => {
                const rl = risks[k] || "normal";
                const ra = riskAssessment?.assessments?.[k];
                return `<tr><td>${a.n}</td><td><span style="padding:2px 8px;border-radius:3px;background:${rl==="erhöht"?"#fee2e2":rl==="vernachlässigbar"?"#f0fdf4":"#f8fafc"};color:${rl==="erhöht"?"#dc2626":rl==="vernachlässigbar"?"#16a34a":"#64748b"}">${rl}</span></td><td style="font-size:11px;color:#666">${ra?.reasoning||"–"}</td></tr>`;
              }).join("");
              const rptLabel = REPORT_TYPES.find(r=>r.id===reportType)?.l || "–";
              const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Revisionsdokumentation – ${mandant.name} – GJ ${year.year}</title>
<style>@page{size:A4;margin:20mm}body{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;color:#1e293b;line-height:1.6;max-width:170mm;margin:0 auto}
h1{font-size:22px;border-bottom:2px solid #1e293b;padding-bottom:8px;margin-top:40px}h2{font-size:16px;color:#334155;margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}h3{font-size:13px;color:#64748b;margin-top:16px}
table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:11px}th{background:#f8fafc;font-weight:600}
.cover{text-align:center;padding:60px 0;page-break-after:always}.cover h1{border:none;font-size:28px}.sig{background:#f0fdf4;padding:8px 12px;border-radius:4px;border:1px solid #86efac;margin:6px 0;font-size:10px}
.page-break{page-break-before:always}
</style></head><body>
<div class="cover"><div style="font-size:48px;margin-bottom:20px;color:#3b82f6">R</div><h1 style="font-size:28px">Revisionsdokumentation</h1><p style="font-size:16px;color:#64748b">${mandant.name}</p><p>Geschäftsjahr ${year.year}</p><p>${year.type}</p><p style="margin-top:30px;color:#94a3b8">Erstellt: ${today}<br>Revisionsassistent · SER 2022</p></div>

<h1>1. Ausgangslage</h1><p><strong>Mandat:</strong> ${mandant.name}<br><strong>Website:</strong> ${mandant.website||"–"}<br><strong>Geschäftsjahr:</strong> ${year.year}<br><strong>Auftragsart:</strong> ${year.type}</p>
${companyInfo?.hrNumber ? `<p><strong>HR-Nr:</strong> ${companyInfo.hrNumber} · <strong>UID:</strong> ${companyInfo.uid||"–"} · <strong>Kapital:</strong> ${companyInfo.capital||"–"}</p>` : ""}
${companyInfo?.purpose ? `<p><strong>Zweck:</strong> ${companyInfo.purpose}</p>` : ""}

<h1>2. Unabhängigkeit & Mandatsannahme</h1>
<h2>Unabhängigkeit (SER 1.3)</h2><table><tbody>${INDEP_CHECKS.map(c=>`<tr><td>☐ ${c}</td></tr>`).join("")}</tbody></table>
<h2>Mandatsannahme (SER 1.4)</h2><table><tbody>${ACCEPT_CHECKS.map(c=>`<tr><td>☐ ${c}</td></tr>`).join("")}</tbody></table>
<h2>Auftragsbestätigung</h2>${auftragsbestSig ? `<div class="sig">✓ Bestätigt: ${auftragsbestSig.email} · ${new Date(auftragsbestSig.timestamp).toLocaleString("de-CH")} · Hash: ${auftragsbestSig.hash}</div>` : "<p>Ausstehend</p>"}

<h1 class="page-break">3. Verständnis & Risikobeurteilung</h1>
<h2>Unternehmensverständnis (SER 3.1)</h2><table><tbody>${UNDERSTAND.map(f=>`<tr><td style="width:180px;font-weight:600">${f.l}</td><td>${understanding[f.k]||"–"}</td></tr>`).join("")}</tbody></table>
<h2>Risikobeurteilung (SER 3.3)</h2>
${riskAssessment?.overallRisk ? `<p><strong>Gesamteinschätzung:</strong> ${riskAssessment.overallRisk}</p>` : ""}
${riskAssessment?.goingConcernRisk ? `<p><strong>Going Concern:</strong> ${riskAssessment.goingConcernRisk}</p>` : ""}
<table><thead><tr><th>Prüfgebiet</th><th>Risiko</th><th>Begründung</th></tr></thead><tbody>${areaRows}</tbody></table>

<h1 class="page-break">4. Jahresrechnung</h1>
<p>Bilanzsumme: <strong>CHF ${fmt(tA)}</strong> · Ertrag: <strong>CHF ${fmt(rev)}</strong> · EK: <strong>CHF ${fmt(eq)}</strong> · Ergebnis: <strong>CHF ${fmt(ni)}</strong></p>
<h2>Aktiven</h2><table><thead><tr><th>Position</th><th style="text-align:right">Aktuell</th><th style="text-align:right">Vorjahr</th></tr></thead><tbody>${finRows(bal?.assets)}</tbody></table>
<h2>Passiven</h2><table><thead><tr><th>Position</th><th style="text-align:right">Aktuell</th><th style="text-align:right">Vorjahr</th></tr></thead><tbody>${finRows(bal?.liabilities)}</tbody></table>
<h2>Erfolgsrechnung</h2><table><thead><tr><th>Position</th><th style="text-align:right">Aktuell</th><th style="text-align:right">Vorjahr</th></tr></thead><tbody>${finRows(inc?.items)}</tbody></table>

<h1 class="page-break">5. Wesentlichkeit (SER Kap. 5)</h1>
<table><thead><tr><th>Bezugsgrösse</th><th style="text-align:right">Wert</th><th>Band</th><th style="text-align:right">Tief</th><th style="text-align:right">Hoch</th></tr></thead><tbody>${mc.o.map(o=>`<tr${o.rec?' style="background:#eff6ff"':""}><td>${o.b}</td><td style="text-align:right;font-family:monospace">${fmt(o.v)}</td><td>${o.r}</td><td style="text-align:right;font-family:monospace">${fmt(o.lo)}</td><td style="text-align:right;font-family:monospace">${fmt(o.hi)}</td></tr>`).join("")}</tbody></table>
<p><strong>Gesamtwesentlichkeit: CHF ${fmt(mat)}</strong> · Toleranz: CHF ${fmt(mc.tol)} · Nichtaufgriff: CHF ${fmt(mc.triv)}</p>

<h1 class="page-break">6. Prüfprogramm (SER Anhang D)</h1>
${Object.entries(AREAS).map(([k,a]) => {
  const rl = risks[k]||"normal";
  return `<h2>${a.n} <span style="font-size:11px;color:${rl==="erhöht"?"#dc2626":"#64748b"}">[${rl}]</span></h2>
<h3>Risiken</h3><ul>${a.r.map(r=>`<li>${r}</li>`).join("")}</ul>
<h3>Befragungen</h3><ul>${a.p.i.map(p=>`<li>☐ ${p}</li>`).join("")}</ul>
${a.p.a.length?`<h3>Analytische PH</h3><ul>${a.p.a.map(p=>`<li>☐ ${p}</li>`).join("")}</ul>`:""}
<h3>Detailprüfungen</h3><ul>${a.p.d.map(p=>`<li>☐ ${p}</li>`).join("")}</ul>
<p style="border:1px solid #e2e8f0;padding:8px;border-radius:4px;min-height:30px;color:#94a3b8">Bemerkungen / Schlussfolgerung:</p>`;
}).join("")}

<h1 class="page-break">7. Übergreifende Prüfungen & Fehlaussagen</h1>
${Object.entries(OVERALL).map(([k,s]) => `<h2>${s.t}</h2><table><tbody>${s.items.map(i=>`<tr><td>☐ ${i}</td></tr>`).join("")}</tbody></table>`).join("")}

<h1 class="page-break">8. Berichterstattung (SER Kap. 8)</h1>
<p><strong>Prüfungsaussage:</strong> ${rptLabel}</p>
<h2>Dokumenten-Status</h2><table><tbody>${sigRow("Auftragsbestätigung", auftragsbestSig)}${sigRow("Vollständigkeitserklärung", veSig)}${sigRow("Jahresrechnung-Freigabe", jrSig)}</tbody></table>
<p style="margin-top:40px;text-align:center;color:#94a3b8;font-size:10px">Generiert am ${today} · Revisionsassistent · SER 2022</p>
</body></html>`;
              const w = window.open("", "_blank");
              if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
              else { const blob = new Blob([html], {type:"text/html"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Revisionsdokumentation_${mandant.name}_GJ${year.year}.html`; a.click(); URL.revokeObjectURL(url); }
            }} style={btnP(false)}>PDF generieren</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={() => setStep(6)} style={btnS()}>←</button></div>
        </div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════
import { supabase } from './supabase.js'

export default function Revisionsassistent({ user, userId, onLogout }) {
  const [mandanten, setMandanten] = useState([]);
  const [view, setView] = useState("mandanten");
  const [selMandant, setSelMandant] = useState(null);
  const [selYear, setSelYear] = useState(null);
  const [settingsMandant, setSettingsMandant] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Load mandanten from Supabase on mount
  useEffect(() => {
    loadMandanten();
  }, []);

  const loadMandanten = async () => {
    setDbLoading(true);
    const { data, error } = await supabase
      .from('mandanten')
      .select('*, team_members(*), revision_years(*)')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setMandanten(data.map(m => ({
        ...m,
        years: m.revision_years || [],
        team: m.team_members || [],
      })));
    }
    setDbLoading(false);
  };

  const createMandant = async (m) => {
    const { data, error } = await supabase
      .from('mandanten')
      .insert({ owner_id: userId, name: m.name, website: m.website })
      .select()
      .single();
    if (!error && data) {
      setMandanten(prev => [{ ...data, years: [], team: [] }, ...prev]);
    } else if (error) {
      alert('Fehler: ' + error.message);
    }
  };

  const updateMandant = async (updated) => {
    const { error } = await supabase
      .from('mandanten')
      .update({ 
        name: updated.name, 
        website: updated.website, 
        mandatsleiter_email: updated.mandatsleiter_email || updated.mandatsleiter,
        company_info: updated.company_info 
      })
      .eq('id', updated.id);
    if (!error) {
      setMandanten(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
      if (selMandant?.id === updated.id) setSelMandant(prev => ({ ...prev, ...updated }));
    }
  };

  const createYear = async (mandantId, y) => {
    const { data, error } = await supabase
      .from('revision_years')
      .insert({ mandant_id: mandantId, year: y.year, audit_type: y.type })
      .select()
      .single();
    if (!error && data) {
      const updated = mandanten.map(m => 
        m.id === mandantId ? { ...m, years: [...(m.years || []), { ...data, status: data.status || 'in_bearbeitung' }] } : m
      );
      setMandanten(updated);
      const sel = updated.find(m => m.id === mandantId);
      if (sel) setSelMandant(sel);
    }
  };

  const inviteTeamMember = async (mandantId, email) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert({ mandant_id: mandantId, email, role: 'assistent', invited_by: userId })
      .select()
      .single();
    if (!error && data) {
      const updated = mandanten.map(m =>
        m.id === mandantId ? { ...m, team: [...(m.team || []), data] } : m
      );
      setMandanten(updated);
      const sel = updated.find(m => m.id === mandantId);
      if (sel) { setSelMandant(sel); setSettingsMandant(sel); }
    }
  };

  const header = (
    <header style={{ background: S.dark, padding: "0 24px", display: "flex", alignItems: "center", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
      <div onClick={() => { setView("mandanten"); setSelMandant(null); setSelYear(null); }} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>R</div>
        <span style={{ color: "#f8fafc", fontSize: 14, fontWeight: 600 }}>Revisionsassistent</span>
      </div>
      <span style={{ marginLeft: "auto", color: S.muted, fontSize: 12 }}>{user}</span>
      <button onClick={onLogout} style={{ marginLeft: 12, padding: "5px 12px", background: "transparent", color: S.hint, border: `1px solid ${S.muted}`, borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: S.font }}>Logout</button>
    </header>
  );

  const handleHilferuf = () => {
    const ml = selMandant?.mandatsleiter_email;
    if (ml) {
      alert(`Hilferuf gesendet an ${ml}!\n\nE-Mail wird generiert:\n\n«Guten Tag,\n\nBeim Mandat ${selMandant.name} (GJ ${selYear?.year}) benötigt der Revisionsassistent Ihre Unterstützung.\n\nBitte prüfen Sie den aktuellen Stand im Revisionsassistenten.\n\nFreundliche Grüsse»`);
    } else {
      alert("Kein Mandatsleiter hinterlegt. Bitte unter Einstellungen definieren.");
    }
  };

  return (
    <div style={{ fontFamily: S.font, color: S.slate, minHeight: "100vh", background: S.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {view !== "workflow" && header}

      {view === "mandanten" && <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        {dbLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ color: S.muted, fontSize: 14 }}>Mandanten werden geladen...</div>
          </div>
        ) : (
          <MandantenScreen mandanten={mandanten} user={user}
            onCreate={createMandant}
            onSelect={m => { setSelMandant(m); setView("jahre"); }}
            onSettings={() => setView("settings")}
          />
        )}
      </div>}

      {view === "jahre" && selMandant && <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        <JahreScreen mandant={selMandant}
          onBack={() => { setView("mandanten"); setSelMandant(null); loadMandanten(); }}
          onCreateYear={y => createYear(selMandant.id, y)}
          onSelectYear={y => { setSelYear(y); setView("workflow"); }}
        />
        <button onClick={() => { setSettingsMandant(selMandant); setView("settings"); }} style={{ ...btnSm(S.surface, S.muted), marginTop: 16 }}>⚙ Einstellungen für {selMandant.name}</button>
      </div>}

      {view === "workflow" && selMandant && selYear && (
        <>
          {header}
          <RevisionWorkflow mandant={selMandant} year={selYear}
            onBack={() => { setView("jahre"); setSelYear(null); }}
            onHilferuf={handleHilferuf}
            user={user}
          />
        </>
      )}

      {view === "settings" && <div style={{ padding: "24px 32px", maxWidth: 600, margin: "0 auto" }}>
        <SettingsScreen
          onBack={() => setView(selMandant ? "jahre" : "mandanten")}
          mandant={settingsMandant || selMandant}
          onUpdate={async (updated) => {
            await updateMandant(updated);
          }}
          onInvite={async (email) => {
            const m = settingsMandant || selMandant;
            if (m) await inviteTeamMember(m.id, email);
          }}
        />
      </div>}
    </div>
  );
}

  const sendDocEmail = async (type, email, setSignature) => {
    if (!email.includes("@")) return;
    try {
      const r = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: email,
          mandant: mandant.name,
          year: year.year,
          user,
          honorar,
          honorarFolge,
        }),
      });
      const data = await r.json();
      if (data.success) {
        setSignature({
          email,
          timestamp: data.timestamp || new Date().toISOString(),
          ip: "via Resend",
          hash: "ID:" + (data.emailId || "").slice(0, 20),
        });
        alert("E-Mail erfolgreich gesendet an " + email);
      } else {
        alert("Fehler beim Senden: " + (data.error || data.details || "Unbekannt"));
      }
    } catch (e) {
      alert("Fehler: " + e.message);
    }
  };


=========================================================================

SCHRITT 2: Suche nach "handleHilferuf" (im APP ROOT Bereich, ca. Zeile 1029)
Ersetze die GANZE Funktion:

--- ALTEN CODE LÖSCHEN: ---
  const handleHilferuf = () => {
    const ml = selMandant?.mandatsleiter_email;
    if (ml) {
      alert(`Hilferuf gesendet an ${ml}!\n\nE-Mail wird generiert:\n\n«Guten Tag,\n\nBeim Mandat ${selMandant.name} (GJ ${selYear?.year}) benötigt der Revisionsassistent Ihre Unterstützung.\n\nBitte prüfen Sie den aktuellen Stand im Revisionsassistenten.\n\nFreundliche Grüsse»`);
    } else {
      alert("Kein Mandatsleiter hinterlegt. Bitte unter Einstellungen definieren.");
    }
  };

--- NEUEN CODE EINFÜGEN: ---
  const handleHilferuf = async () => {
    const ml = selMandant?.mandatsleiter_email || selMandant?.mandatsleiter;
    if (!ml) { alert("Kein Mandatsleiter hinterlegt. Bitte unter Einstellungen definieren."); return; }
    try {
      const r = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hilferuf", to: ml, mandant: selMandant.name, year: selYear?.year, user }),
      });
      const data = await r.json();
      if (data.success) alert("Hilferuf gesendet an " + ml + "!");
      else alert("Fehler: " + (data.error || data.details || "Unbekannt"));
    } catch (e) { alert("Fehler: " + e.message); }
  };

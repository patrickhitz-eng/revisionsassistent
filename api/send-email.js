export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { type, to, mandant, year, user, honorar, honorarFolge } = await req.json();

    let subject = '';
    let html = '';

    const header = `<div style="font-family:'IBM Plex Sans',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">`;
    const logo = `<div style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:20px 24px;border-radius:12px 12px 0 0;"><strong style="font-size:18px;">Revisionsassistent</strong></div>`;
    const footer = `<div style="padding:16px 24px;background:#f8fafc;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">Diese E-Mail wurde automatisch generiert vom Revisionsassistent.<br>XELLENZ Revisionen GmbH</div></div>`;

    const confirmUrl = `https://revisionsassistent.vercel.app/#confirm-${type}-${Date.now()}`;

    switch (type) {
      case 'auftragsbestaetigung':
        subject = `Auftragsbestätigung – ${mandant} (GJ ${year})`;
        html = `${header}${logo}
          <div style="padding:24px;">
            <h2 style="margin:0 0 16px;font-size:20px;">Auftragsbestätigung</h2>
            <p>Sehr geehrte Damen und Herren,</p>
            <p>Anbei erhalten Sie die Auftragsbestätigung für die eingeschränkte Revision der <strong>${mandant}</strong> für das Geschäftsjahr <strong>${year}</strong>.</p>
            <p>Die Eingeschränkte Revision erfolgt nach dem «Standard zur Eingeschränkten Revision» (SER 2022) mit dem Ziel einer Aussage darüber, ob wir auf Sachverhalte gestossen sind, die uns zum Schluss veranlassen, dass die Jahresrechnung nicht in allen wesentlichen Punkten Gesetz und Statuten entspricht.</p>
            <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #fbbf24;">
              <strong>Honorar:</strong> CHF ${honorar || "3'200"} im ersten Jahr, CHF ${honorarFolge || honorar || "3'200"} in den Folgejahren (zzgl. Barauslagen und MwSt.).
            </div>
            <p>Bitte bestätigen Sie den Erhalt und Ihr Einverständnis durch Klick auf den folgenden Button:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Auftragsbestätigung bestätigen</a>
            </div>
            <p style="color:#64748b;font-size:13px;">XELLENZ Revisionen GmbH<br>${user || ''}</p>
          </div>${footer}`;
        break;

      case 've':
        subject = `Vollständigkeitserklärung – ${mandant} (GJ ${year})`;
        html = `${header}${logo}
          <div style="padding:24px;">
            <h2 style="margin:0 0 16px;font-size:20px;">Vollständigkeitserklärung</h2>
            <p>Sehr geehrte Damen und Herren,</p>
            <p>Im Rahmen der eingeschränkten Revision der <strong>${mandant}</strong> für das Geschäftsjahr <strong>${year}</strong> bitten wir Sie um Unterzeichnung der Vollständigkeitserklärung gemäss SER Anhang E.</p>
            <p>Mit der Vollständigkeitserklärung bestätigen Sie als Verwaltungsrat:</p>
            <ul style="color:#475569;line-height:1.8;">
              <li>Die Jahresrechnung ist vollständig und korrekt</li>
              <li>Alle Auskünfte wurden wahrheitsgemäss erteilt</li>
              <li>Alle Verpflichtungen sind erfasst</li>
              <li>Es bestehen keine nicht offengelegten Sachverhalte</li>
            </ul>
            <div style="text-align:center;margin:24px 0;">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Vollständigkeitserklärung bestätigen</a>
            </div>
            <p style="color:#64748b;font-size:13px;">XELLENZ Revisionen GmbH<br>${user || ''}</p>
          </div>${footer}`;
        break;

      case 'jr_freigabe':
        subject = `Jahresrechnung Freigabe – ${mandant} (GJ ${year})`;
        html = `${header}${logo}
          <div style="padding:24px;">
            <h2 style="margin:0 0 16px;font-size:20px;">Freigabe Jahresrechnung</h2>
            <p>Sehr geehrter Herr Verwaltungsratspräsident,</p>
            <p>Bitte bestätigen Sie die Freigabe der Jahresrechnung der <strong>${mandant}</strong> für das Geschäftsjahr <strong>${year}</strong> gemäss Art. 958 Abs. 3 OR.</p>
            <p>Mit Ihrer Bestätigung erklären Sie, dass die Jahresrechnung vom Vorsitzenden des obersten Leitungsorgans und der für die Rechnungslegung zuständigen Person genehmigt wurde.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Jahresrechnung freigeben</a>
            </div>
            <p style="color:#64748b;font-size:13px;">XELLENZ Revisionen GmbH<br>${user || ''}</p>
          </div>${footer}`;
        break;

      case 'hilferuf':
        subject = `🚨 Hilferuf – ${mandant} (GJ ${year})`;
        html = `${header}${logo}
          <div style="padding:24px;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#dc2626;">🚨 Hilferuf</h2>
            <p>Guten Tag,</p>
            <p>Beim Mandat <strong>${mandant}</strong> (GJ <strong>${year}</strong>) benötigt der Revisionsassistent Ihre Unterstützung.</p>
            <div style="background:#fee2e2;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #fca5a5;">
              <strong>Gesendet von:</strong> ${user}<br>
              <strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })}
            </div>
            <p>Bitte prüfen Sie den aktuellen Stand im <a href="https://revisionsassistent.vercel.app" style="color:#7c3aed;">Revisionsassistenten</a>.</p>
            <p style="color:#64748b;font-size:13px;">Freundliche Grüsse<br>Revisionsassistent</p>
          </div>${footer}`;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Revisionsassistent <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: 'Email send failed', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const result = await response.json();

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: result.id,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

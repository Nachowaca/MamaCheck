import { useEffect, useState, useRef } from "react";

// ---- Tokens (de styles.css del handoff) ----
const C = {
  bg: "#161826",
  surface: "#232532",
  text: "#e9e9ed",
  accent: "#9184d9",
  accent100: "#f5f4ff",
  accent800: "#423a6a",
  neutral800: "#3f424d",
  neutral900: "#292b31",
  divider: "rgba(233,233,237,0.16)",
  danger: "#e0716b",
  dangerText: "#f0a29d",
};

const radiusMd = 8;
const radiusLg = 14;
const shadowLg = "0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)";
const shadowSm = "0 0 0 1px #3f424d";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

// ---- Piezas compartidas ----
function GoogleGlyph({ size = 18 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background:
          "conic-gradient(from 90deg,#4285F4,#34A853,#FBBC05,#EA4335,#4285F4)",
        flex: "none",
      }}
    />
  );
}

function AccountButton({ initial, name, email, onClick, big }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: big ? 14 : 12,
        background: "transparent",
        border: `1px solid ${C.divider}`,
        borderRadius: radiusMd,
        padding: big ? 16 : "12px 14px",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: big ? 44 : 36,
          height: big ? 44 : 36,
          borderRadius: "50%",
          background: C.neutral800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          fontSize: big ? 18 : 14,
          color: C.accent,
          flex: "none",
        }}
      >
        {initial}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: big ? 18 : 14, fontWeight: 500, color: C.text }}>
          {name}
        </div>
        <div style={{ fontSize: big ? 14 : 12, opacity: 0.6 }}>{email}</div>
      </div>
      <GoogleGlyph size={big ? 22 : 18} />
    </button>
  );
}

function Connecting({ big }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: big ? 16 : 14,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: big ? 84 : 56,
          height: big ? 84 : 56,
          borderRadius: "50%",
          border: `${big ? 2 : 1.5}px solid ${C.accent}`,
          animation: "pulseRing 1.3s ease-in-out infinite",
        }}
      />
      <p style={{ fontSize: big ? 19 : 13, opacity: 0.8, margin: 0 }}>
        Conectando{big ? "…" : " con Google…"}
      </p>
    </div>
  );
}

function Card({ children, style, elev }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 12,
        borderRadius: radiusMd,
        background: C.surface,
        boxShadow: elev ? shadowSm : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, variant = "outline" }) {
  const styles = {
    accent: { background: C.accent800, color: C.accent100 },
    outline: { border: `1px solid ${C.accent}`, color: C.accent },
    neutral: { background: C.neutral800, color: "#f3f5fe" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        letterSpacing: "0.02em",
        padding: "3px 10px",
        borderRadius: 6,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

// ==================================================================
// APP DE NACHO (cuidador) — arranca directo en "auth" (viene del login único)
// ==================================================================
function CuidadorApp({ session, onSignOut }) {
  const [view, setView] = useState("auth");
  const [heartRate, setHeartRate] = useState(71);
  const [dot, setDot] = useState({ x: 42, y: 44 });
  const [chatOpen, setChatOpen] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, time: "09:14", text: "Salió de la zona segura por 6 minutos", tag: "outline" },
    { id: 2, time: "08:02", text: 'Check-in: "Estoy bien"', tag: "neutral" },
  ]);
  const sosActive = false; // demo: cambiar a true para ver banner de emergencia
  const timer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setView("dashboard"), 1300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (view !== "dashboard") return;
    timer.current = setInterval(() => {
      setHeartRate((h) => Math.max(64, Math.min(84, h + Math.round((Math.random() - 0.5) * 4))));
      setDot((d) => ({
        x: Math.max(36, Math.min(48, d.x + (Math.random() - 0.5) * 2)),
        y: Math.max(38, Math.min(50, d.y + (Math.random() - 0.5) * 2)),
      }));
    }, 2500);
    return () => clearInterval(timer.current);
  }, [view]);

  function sendQuick(text) {
    setChatOpen(false);
    setAlerts((a) => [{ id: Date.now(), time: "ahora", text, tag: "accent" }, ...a].slice(0, 4));
  }

  if (view === "auth") return <Centered><Connecting /></Centered>;

  if (view === "profile") {
    return (
      <Centered>
        <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 16 }}>
          <button
            onClick={() => setView("dashboard")}
            style={{ alignSelf: "flex-start", color: C.accent, background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}
          >
            ← Volver
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.neutral800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.accent }}>{session.initial}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500 }}>Nacho</div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>{session.email}</div>
            </div>
          </div>
          <div>
            <h5 style={{ margin: "0 0 8px", opacity: 0.7 }}>Conectado con</h5>
            <Card style={{ flexDirection: "row", alignItems: "center", padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.neutral800, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flex: "none" }}>L</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Laura</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Cuenta separada · en línea</div>
              </div>
              <Tag variant="accent">Activo</Tag>
            </Card>
          </div>
          <div>
            <h5 style={{ margin: "0 0 8px", opacity: 0.7 }}>Notificaciones</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Alertas de caída o inactividad", "Salida de zona segura", "Resumen diario con IA"].map((t) => (
                <Card key={t} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
                  <span style={{ fontSize: 13 }}>{t}</span>
                  <Tag variant="outline">Activas</Tag>
                </Card>
              ))}
            </div>
          </div>
          <button onClick={onSignOut} style={btnSecondary}>Cerrar sesión</button>
        </div>
      </Centered>
    );
  }

  // dashboard
  return (
    <Centered>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{greeting()}</div>
            <h3 style={{ margin: 0 }}>Nacho</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Tag variant="accent">En zona segura</Tag>
            <button
              onClick={() => setView("profile")}
              style={{ width: 34, height: 34, borderRadius: "50%", background: C.neutral800, border: `1px solid ${C.divider}`, color: C.accent, cursor: "pointer" }}
            >
              {session.initial}
            </button>
          </div>
        </div>

        {sosActive && (
          <div style={{ border: `1px solid ${C.danger}`, borderRadius: radiusMd, background: "rgba(224,113,107,0.14)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: C.dangerText, fontWeight: 500 }}>Emergencia activada</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Laura pidió ayuda hace un momento</div>
            </div>
            <button style={{ ...btnGhostDanger }}>Llamar ya</button>
          </div>
        )}

        <div style={{ borderRadius: radiusMd, overflow: "hidden", boxShadow: shadowSm }}>
          <div style={{ position: "relative", height: 220, background: "#1b2334", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
              <rect x="0" y="0" width="300" height="220" fill="#1b2334" />
              <path d="M0 150 Q80 120 130 140 T300 110" fill="none" stroke="#2a3548" strokeWidth="10" />
              <path d="M40 0 Q60 60 50 110 T80 220" fill="none" stroke="#2a3548" strokeWidth="8" />
              <path d="M0 60 Q100 40 180 60 T300 40" fill="none" stroke="#252e40" strokeWidth="5" />
              <path d="M200 0 Q210 90 230 140 T260 220" fill="none" stroke="#252e40" strokeWidth="5" />
              <ellipse cx="225" cy="70" rx="46" ry="34" fill="#243626" />
            </svg>
            <div style={{ position: "absolute", left: "38%", top: "32%", width: 112, height: 112, borderRadius: "50%", border: `1.5px dashed rgba(145,132,217,0.55)` }} />
            <div style={{ position: "absolute", left: `${dot.x}%`, top: `${dot.y}%`, transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "rgba(145,132,217,0.25)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulseDot 1.8s ease-in-out infinite" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent, border: "2.5px solid #f3f5fe" }} />
            </div>
            <div style={{ position: "absolute", left: 10, bottom: 10, fontSize: 11, background: "rgba(22,24,38,0.7)", padding: "3px 8px", borderRadius: 999 }}>
              Casa · zona segura
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Card style={{ alignItems: "center", textAlign: "center", gap: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M12 21s-7-4.5-9.5-9C.7 8.4 2 4.8 5.3 4.2c2-.4 3.9.6 4.7 2.3.8-1.7 2.7-2.7 4.7-2.3 3.3.6 4.6 4.2 2.8 7.8-2.5 4.5-9.5 9-9.5 9z" /></svg>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{heartRate}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>lpm</div>
          </Card>
          <Card style={{ alignItems: "center", textAlign: "center", gap: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
            <div style={{ fontSize: 18, fontWeight: 500 }}>7.3h</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>sueño</div>
          </Card>
          <Card style={{ alignItems: "center", textAlign: "center", gap: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <div style={{ fontSize: 13, fontWeight: 500 }}>hace 4 min</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>movimiento</div>
          </Card>
        </div>

        <Card elev style={{ gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5 9.7l4.9-1.8L12 3z" /></svg>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent }}>Análisis de IA</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Todo indica que está bien</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.85, display: "flex", flexDirection: "column", gap: 5 }}>
            <li>Ritmo cardíaco y sueño dentro de su rango habitual de las últimas 2 semanas.</li>
            <li>Se movió con normalidad en las últimas 4 horas — sin patrones que sugieran una caída.</li>
            <li>Salió de la zona segura 6 minutos ayer, coincide con su caminata habitual de la tarde.</li>
          </ul>
          <div style={{ fontSize: 11, opacity: 0.5 }}>Generado a partir de sensores del teléfono y del reloj · se actualiza solo</div>
        </Card>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setChatOpen(true)} style={{ ...btnSecondary, flex: 1, height: 44 }}>Mensaje rápido</button>
          <button style={{ ...btnPrimary, flex: 1, height: 44 }}>Llamar</button>
        </div>

        <div>
          <h5 style={{ margin: "0 0 8px", opacity: 0.7 }}>Actividad reciente</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((a) => (
              <Card key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                <Tag variant={a.tag}>{a.time}</Tag>
                <div style={{ fontSize: 13 }}>{a.text}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {chatOpen && (
        <Dialog onClose={() => setChatOpen(false)}>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Mensaje rápido a Laura</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>Se envía como notificación simple a su teléfono.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={btnSecondary} onClick={() => sendQuick("Todo bien, gracias por avisar")}>Todo bien, gracias por avisar</button>
            <button style={btnSecondary} onClick={() => sendQuick("Te llamo en 5 minutos")}>Te llamo en 5 minutos</button>
            <button style={btnSecondary} onClick={() => sendQuick("¿Tomaste la medicación?")}>¿Tomaste la medicación?</button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{ ...btnGhost }} onClick={() => setChatOpen(false)}>Cerrar</button>
          </div>
        </Dialog>
      )}
    </Centered>
  );
}

// ==================================================================
// APP DE LAURA — arranca directo en "auth" (viene del login único)
// ==================================================================
function LauraApp({ session, onSignOut }) {
  const [view, setView] = useState("auth");
  const [checkInNote, setCheckInNote] = useState("Último aviso: hace 3 horas");
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [contacts, setContacts] = useState([
    { id: 1, name: "Nacho", initial: "N", note: "Toca para llamar" },
    { id: 2, name: "Andrea", initial: "A", note: "Toca para llamar" },
    { id: 3, name: "Ceci", initial: "C", note: "Toca para llamar" },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setView("home"), 1300);
    return () => clearTimeout(t);
  }, []);

  function callContact(id) {
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, note: "Llamando…" } : c)));
    setTimeout(() => {
      setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, note: "Toca para llamar" } : c)));
    }, 2200);
  }

  if (view === "auth") return <Centered pad={24}><Connecting big /></Centered>;

  return (
    <Centered pad={24}>
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>{greeting()}, {session.email.split("@")[0]}</h2>

        <button
          onClick={() => setCheckInNote("Avisamos a tu familia recién ahora")}
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "transparent",
            border: `2px solid ${C.accent}`,
            color: C.accent,
            fontWeight: 500,
            fontSize: 22,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M4 12.5l5 5L20 7" /></svg>
          Estoy bien
        </button>
        <p style={{ fontSize: 16, opacity: 0.7, margin: 0 }}>{checkInNote}</p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {contacts.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: C.surface, borderRadius: radiusLg, padding: "11px 16px" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.neutral800, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 17, flex: "none" }}>
                {c.initial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 14, opacity: 0.65 }}>{c.note}</div>
              </div>
              <button
                onClick={() => callContact(c.id)}
                style={{ width: 36, height: 36, borderRadius: radiusMd, border: `1px solid ${C.divider}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.6"><path d="M4 5c0 8.3 6.7 15 15 15l2-4-5-2-1.5 1.5A11 11 0 0 1 7.5 8.5L9 7 7 2 3 4" /></svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSosOpen(true)}
          style={{ width: "100%", height: 52, borderRadius: radiusMd, border: `1px solid ${C.danger}`, color: C.dangerText, background: "transparent", fontWeight: 500, fontSize: 18, cursor: "pointer" }}
        >
          Necesito ayuda
        </button>

        <p style={{ fontSize: 14, opacity: 0.55, textAlign: "center", margin: 0 }}>Tu familia puede ver que estás bien</p>
        <a href="#" onClick={(e) => { e.preventDefault(); onSignOut(); }} style={{ fontSize: 13, opacity: 0.5, color: C.accent }}>
          Salir
        </a>
      </div>

      {sosOpen && (
        <Dialog>
          <div style={{ fontSize: 20, fontWeight: 500 }}>¿Pedir ayuda?</div>
          <div style={{ fontSize: 16, opacity: 0.85 }}>Le avisamos a tu familia ahora mismo con tu ubicación.</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button style={btnSecondary} onClick={() => setSosOpen(false)}>Cancelar</button>
            <button style={btnGhostDanger} onClick={() => { setSosOpen(false); setSosSent(true); }}>Sí, avisar</button>
          </div>
        </Dialog>
      )}
      {sosSent && (
        <Dialog>
          <div style={{ alignItems: "center", textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1.5px solid ${C.danger}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.dangerText} strokeWidth="1.6"><path d="M4 12.5l5 5L20 7" /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>Le avisamos a tu familia</div>
            <div style={{ fontSize: 16, opacity: 0.85 }}>Le avisamos a tu familia y ya lo saben.</div>
            <button style={btnSecondary} onClick={() => setSosSent(false)}>Cerrar</button>
          </div>
        </Dialog>
      )}
    </Centered>
  );
}

// ---- Layout helpers ----
function Centered({ children, pad = 32 }) {
  return (
    <div
      style={{
        minHeight: "100%",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
        fontFamily: "Inter, system-ui, sans-serif",
        color: C.text,
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

function Dialog({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16, background: "rgba(41,43,49,0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px,100%)", display: "flex", flexDirection: "column", gap: 12, padding: 20, borderRadius: radiusLg, background: C.surface, boxShadow: shadowLg }}
      >
        {children}
      </div>
    </div>
  );
}

const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
  fontWeight: 500,
  fontSize: 14,
  padding: "8px 12px",
  borderRadius: radiusMd,
  background: "transparent",
};
const btnPrimary = { ...btnBase, color: C.accent, border: `1px solid ${C.accent}` };
const btnSecondary = { ...btnBase, color: C.text, border: `1px solid ${C.divider}` };
const btnGhost = { ...btnBase, color: C.accent, border: "1px solid transparent" };
const btnGhostDanger = { ...btnBase, color: C.dangerText, border: `1px solid ${C.danger}` };

// ==================================================================
// LOGIN ÚNICO — elegís tu perfil y entrás con tu propio mail de Google
// ==================================================================
function GoogleSignIn({ placeholder, onSignedIn }) {
  const [email, setEmail] = useState("");

  function initialFrom(mail) {
    return mail.trim()[0]?.toUpperCase() || "?";
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: `1px solid ${C.divider}`,
          borderRadius: radiusMd,
          padding: "10px 12px",
        }}
      >
        <GoogleGlyph size={18} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
      </div>
      <button
        onClick={() => email.trim() && onSignedIn(email.trim(), initialFrom(email))}
        disabled={!email.trim()}
        style={{ ...btnPrimary, width: "100%", height: 44, opacity: email.trim() ? 1 : 0.45 }}
      >
        Continuar con Google
      </button>
    </div>
  );
}

function LoginGate({ onPick }) {
  const [role, setRole] = useState(null); // null | "nacho" | "laura"

  return (
    <Centered>
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: C.surface,
          borderRadius: radiusLg,
          boxShadow: shadowLg,
          padding: "44px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        {/* Logo — mismo check monoline que "Estoy bien", con glow suave */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${C.accent2 || "#a7a1db"}22, transparent 70%)`,
            border: `1.5px solid ${C.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            boxShadow: `0 0 24px rgba(145,132,217,0.35)`,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
            <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.02em" }}>
          Mama<span style={{ color: C.accent }}>Check</span>
        </h2>
        <p style={{ margin: "2px 0 26px", fontSize: 13, opacity: 0.6 }}>
          Cuidado a distancia, con calma
        </p>

        {role === null && (
          <>
            <p style={{ margin: "0 0 16px", fontSize: 13, opacity: 0.75 }}>¿Quién entra?</p>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              <RoleCard
                title="Soy Nacho"
                subtitle="Ves ubicación, estado y alertas"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M12 21s-7-4.5-9.5-9C.7 8.4 2 4.8 5.3 4.2c2-.4 3.9.6 4.7 2.3.8-1.7 2.7-2.7 4.7-2.3 3.3.6 4.6 4.2 2.8 7.8-2.5 4.5-9.5 9-9.5 9z" /></svg>
                }
                onClick={() => setRole("nacho")}
              />
              <RoleCard
                title="Soy mamá"
                subtitle="Avisar que estoy bien y pedir ayuda"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6"><path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                }
                onClick={() => setRole("laura")}
              />
            </div>
          </>
        )}

        {role !== null && (
          <>
            <p style={{ margin: "0 0 18px", fontSize: 13, opacity: 0.75 }}>
              Entrá con tu cuenta de Google
            </p>
            <GoogleSignIn
              placeholder={role === "nacho" ? "tu-mail@gmail.com" : "mail-de-mamá@gmail.com"}
              onSignedIn={(email, initial) => onPick(role, email, initial)}
            />
            <button
              onClick={() => setRole(null)}
              style={{ ...btnGhost, marginTop: 10, fontSize: 12, opacity: 0.7 }}
            >
              ← Volver
            </button>
          </>
        )}
      </div>
    </Centered>
  );
}

function RoleCard({ title, subtitle, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "transparent",
        border: `1px solid ${C.divider}`,
        borderRadius: radiusMd,
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color .15s ease, background .15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "rgba(145,132,217,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.divider; e.currentTarget.style.background = "transparent"; }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: C.neutral800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{title}</div>
        <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: 1 }}>{subtitle}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8" style={{ flex: "none", opacity: 0.7 }}><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}

// ==================================================================
// SHELL — login único, cada perfil entra con su propio mail de Google
// ==================================================================
export default function SaveMama() {
  const [session, setSession] = useState(null); // null | { role, email, initial }

  function handlePick(role, email, initial) {
    setSession({ role, email, initial });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{`
        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(145,132,217,0.55)}50%{box-shadow:0 0 0 10px transparent}}
        @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(145,132,217,0.45)}50%{box-shadow:0 0 0 14px transparent}}
      `}</style>
      {session === null && <LoginGate onPick={handlePick} />}
      {session?.role === "nacho" && (
        <CuidadorApp session={session} onSignOut={() => setSession(null)} />
      )}
      {session?.role === "laura" && (
        <LauraApp session={session} onSignOut={() => setSession(null)} />
      )}
    </div>
  );
}

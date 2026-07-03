import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '../hooks/useRegister'

/* ── Estilos ──────────────────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F8F4EE',
    backgroundImage: 'radial-gradient(circle, #2D6A4F18 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    padding: '24px 16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #E0D9CF',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(45,106,79,0.10)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '28px',
    gap: '10px',
  },
  logoIcon: { width: '48px', height: '48px' },
  brand: { fontSize: '22px', fontWeight: '700', color: '#2D6A4F', letterSpacing: '-0.5px' },
  heading: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: '4px',
    letterSpacing: '-0.3px',
  },
  subheading: { fontSize: '14px', color: '#6B6B6B', marginBottom: '28px' },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '15px',
    border: '1.5px solid #D0C8BC',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#FDFBF8',
    color: '#1C1C1C',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  inputFocus: { borderColor: '#2D6A4F' },
  fieldWrap: { marginBottom: '18px' },
  hint: { fontSize: '11px', color: '#8C8C8C', marginTop: '5px' },
  errorBox: {
    backgroundColor: '#FEF2EE',
    border: '1px solid #F1C4B5',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#C1440E',
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#2D6A4F',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    marginTop: '4px',
  },
  buttonDisabled: { backgroundColor: '#95D5B2', cursor: 'not-allowed' },
  successBox: {
    backgroundColor: '#EDFAF3',
    border: '1px solid #95D5B2',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center' as const,
  },
  divider: { borderTop: '1px solid #E8E2DA', margin: '24px 0' },
  footer: { marginTop: '20px', textAlign: 'center' as const, fontSize: '13px', color: '#6B6B6B' },
  footerLink: { color: '#2D6A4F', fontWeight: '600', textDecoration: 'none' },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#2D6A4F',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
} as const

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function RecycleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={s.logoIcon}>
      <circle cx="24" cy="24" r="22" fill="#2D6A4F" opacity="0.08" />
      <path
        d="M24 10 A14 14 0 0 1 38 24"
        stroke="#2D6A4F"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 24 A14 14 0 0 1 24 38"
        stroke="#95D5B2"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 38 A14 14 0 0 1 10 24"
        stroke="#2D6A4F"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 24 A14 14 0 0 1 24 10"
        stroke="#95D5B2"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="24,6 24,10 28,10"
        stroke="#2D6A4F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="42,24 38,24 38,20"
        stroke="#95D5B2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="24,42 24,38 20,38"
        stroke="#2D6A4F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="6,24 10,24 10,28"
        stroke="#95D5B2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

/* ── Tipos ────────────────────────────────────────────────────────────────── */
type Rol = 'USUARIO_GENERAL' | 'REPARADOR_VERIFICADO'

/* ── Tarjeta de rol ───────────────────────────────────────────────────────── */
function RolCard({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
  color,
  bgColor,
  borderColor,
}: {
  value: Rol
  selected: boolean
  onSelect: () => void
  icon: string
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}) {
  return (
    <button
      id={`rol-${value}`}
      type="button"
      onClick={onSelect}
      style={{
        flex: 1,
        padding: '16px 14px',
        borderRadius: '10px',
        border: `2px solid ${selected ? borderColor : '#E0D9CF'}`,
        background: selected ? bgColor : '#FDFBF8',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        position: 'relative',
        boxShadow: selected ? `0 0 0 3px ${bgColor}` : 'none',
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: borderColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#fff',
            fontWeight: '700',
          }}
        >
          ✓
        </span>
      )}
      <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: '700',
          color: selected ? color : '#1C1C1C',
          marginBottom: '4px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '11px', color: '#6B6B6B', lineHeight: '1.4' }}>{description}</div>
    </button>
  )
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export function RegisterPage() {
  const { register, loading, error, success } = useRegister()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('USUARIO_GENERAL')
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register({ nombre, email, password, rol })
  }

  const inputStyle = (field: string) => ({
    ...s.input,
    ...(focused === field ? s.inputFocus : {}),
  })

  /* ── Pantalla de éxito ───────────────────────────────────────────────────── */
  if (success) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logoWrap}>
            <RecycleIcon />
            <span style={s.brand}>ReCircula</span>
          </div>
          <div style={s.successBox}>
            <div style={{ fontSize: '38px', marginBottom: '12px' }}>📬</div>
            <p
              style={{ fontSize: '18px', fontWeight: '700', color: '#2D6A4F', marginBottom: '8px' }}
            >
              ¡Revisa tu correo!
            </p>
            <p style={{ fontSize: '14px', color: '#3D3D3D', lineHeight: '1.5' }}>
              Enviamos un enlace de verificación a <strong>{email}</strong>. Haz clic en él para
              activar tu cuenta de{' '}
              <strong>{rol === 'REPARADOR_VERIFICADO' ? 'Reparador' : 'Usuario General'}</strong>.
            </p>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>¿No lo recibiste? </span>
            <button
              style={s.resendBtn}
              onClick={() =>
                fetch('/api/v1/identity/resend-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
              }
            >
              Reenviar correo
            </button>
          </div>
          <hr style={s.divider} />
          <p style={s.footer}>
            <Link to="/login" style={s.footerLink}>
              ← Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    )
  }

  /* ── Formulario ──────────────────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <RecycleIcon />
          <span style={s.brand}>ReCircula</span>
        </div>

        <h1 style={s.heading}>Crea tu cuenta</h1>
        <p style={s.subheading}>Únete a la comunidad de reparación circular</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Selector de rol ────────────────────────────────────────────── */}
          <div style={s.fieldWrap}>
            <label style={s.label}>¿Cómo quieres participar?</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <RolCard
                value="USUARIO_GENERAL"
                selected={rol === 'USUARIO_GENERAL'}
                onSelect={() => setRol('USUARIO_GENERAL')}
                icon="🛒"
                title="Usuario General"
                description="Publica artículos, realiza intercambios y dona equipo en desuso."
                color="#2D6A4F"
                bgColor="rgba(45,106,79,0.07)"
                borderColor="#2D6A4F"
              />
              <RolCard
                value="REPARADOR_VERIFICADO"
                selected={rol === 'REPARADOR_VERIFICADO'}
                onSelect={() => setRol('REPARADOR_VERIFICADO')}
                icon="🔧"
                title="Reparador"
                description="Ofrece servicios de reparación y conecta con quienes te necesitan."
                color="#059669"
                bgColor="rgba(5,150,105,0.07)"
                borderColor="#059669"
              />
            </div>
          </div>

          {/* ── Nombre ─────────────────────────────────────────────────────── */}
          <div style={s.fieldWrap}>
            <label htmlFor="nombre" style={s.label}>
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onFocus={() => setFocused('nombre')}
              onBlur={() => setFocused(null)}
              style={inputStyle('nombre')}
              placeholder={
                rol === 'REPARADOR_VERIFICADO' ? 'Ej. Taller García / Juan García' : 'María García'
              }
            />
          </div>

          {/* ── Email ──────────────────────────────────────────────────────── */}
          <div style={s.fieldWrap}>
            <label htmlFor="email" style={s.label}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={inputStyle('email')}
              placeholder="tu@correo.com"
            />
          </div>

          {/* ── Contraseña ─────────────────────────────────────────────────── */}
          <div style={s.fieldWrap}>
            <label htmlFor="password" style={s.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={inputStyle('password')}
              placeholder="Mínimo 8 caracteres"
            />
            <p style={s.hint}>Usa al menos 8 caracteres con letras y números.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.button, ...(loading ? s.buttonDisabled : {}) }}
          >
            {loading
              ? 'Creando cuenta…'
              : `Registrarme como ${rol === 'REPARADOR_VERIFICADO' ? 'Reparador' : 'Usuario General'}`}
          </button>
        </form>

        <hr style={s.divider} />
        <p style={s.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={s.footerLink}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

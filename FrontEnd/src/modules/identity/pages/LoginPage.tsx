import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'

// ── Estilos inline como objeto (sin dependencia de CSS externo) ───────────────
const styles = {
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
    maxWidth: '420px',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '32px',
    gap: '10px',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
  },
  brand: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2D6A4F',
    letterSpacing: '-0.5px',
  },
  heading: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: '6px',
    letterSpacing: '-0.3px',
  },
  subheading: {
    fontSize: '14px',
    color: '#6B6B6B',
    marginBottom: '32px',
  },
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
  inputFocus: {
    borderColor: '#2D6A4F',
  },
  fieldWrap: {
    marginBottom: '20px',
  },
  forgotLink: {
    display: 'block',
    textAlign: 'right' as const,
    fontSize: '12px',
    color: '#2D6A4F',
    textDecoration: 'none',
    marginTop: '6px',
    fontWeight: '500',
  },
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
  buttonDisabled: {
    backgroundColor: '#95D5B2',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center' as const,
    fontSize: '13px',
    color: '#6B6B6B',
  },
  footerLink: {
    color: '#2D6A4F',
    fontWeight: '600',
    textDecoration: 'none',
  },
  divider: {
    borderTop: '1px solid #E8E2DA',
    margin: '28px 0',
  },
} as const

// ── Ícono SVG de ciclo (signature visual) ─────────────────────────────────────
function RecycleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.logoIcon}>
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
      {/* flechas */}
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

// ── Componente ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const inputStyle = (field: string) => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
  })

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <RecycleIcon />
          <span style={styles.brand}>ReCircula</span>
        </div>

        <h1 style={styles.heading}>Bienvenido de vuelta</h1>
        <p style={styles.subheading}>Ingresa a tu cuenta para continuar</p>

        {/* Error */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.fieldWrap}>
            <label htmlFor="email" style={styles.label}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
              placeholder="tu@correo.com"
            />
          </div>

          <div style={styles.fieldWrap}>
            <label htmlFor="password" style={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('password')}
              placeholder="••••••••"
            />
            <Link to="/forgot-password" style={styles.forgotLink}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <hr style={styles.divider} />

        <p style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={styles.footerLink}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}

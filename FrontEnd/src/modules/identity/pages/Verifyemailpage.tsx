import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../services/identity.service'
import { extractErrorMessage } from '../../../shared/utils/extractErrorMessage'

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
    textAlign: 'center' as const,
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '32px',
    gap: '10px',
  },
  logoIcon: { width: '48px', height: '48px' },
  brand: { fontSize: '22px', fontWeight: '700', color: '#2D6A4F', letterSpacing: '-0.5px' },
  stateIcon: { fontSize: '48px', marginBottom: '16px' },
  heading: { fontSize: '22px', fontWeight: '700', color: '#1C1C1C', marginBottom: '10px' },
  text: { fontSize: '14px', color: '#5A5A5A', lineHeight: '1.6', marginBottom: '28px' },
  // Loading spinner
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E0D9CF',
    borderTopColor: '#2D6A4F',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 20px',
  },
  button: {
    display: 'inline-block',
    padding: '12px 28px',
    backgroundColor: '#2D6A4F',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  errorBox: {
    backgroundColor: '#FEF2EE',
    border: '1px solid #F1C4B5',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '13px',
    color: '#C1440E',
    marginBottom: '20px',
  },
  successBox: {
    backgroundColor: '#EDFAF3',
    border: '1px solid #95D5B2',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px',
  },
  link: { color: '#2D6A4F', fontWeight: '600', textDecoration: 'none', fontSize: '14px' },
} as const

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

type Status = 'loading' | 'success' | 'error' | 'missing'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) return

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorMsg(extractErrorMessage(err))
        setStatus('error')
      })
  }, [token])

  return (
    <div style={styles.page}>
      {/* Spinner keyframe vía style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <RecycleIcon />
          <span style={styles.brand}>ReCircula</span>
        </div>

        {/* ── Cargando ── */}
        {status === 'loading' && (
          <>
            <div style={styles.spinner} />
            <h1 style={styles.heading}>Verificando tu cuenta</h1>
            <p style={styles.text}>Un momento, estamos activando tu cuenta…</p>
          </>
        )}

        {/* ── Éxito ── */}
        {status === 'success' && (
          <>
            <div style={styles.stateIcon}>✅</div>
            <h1 style={styles.heading}>¡Cuenta activada!</h1>
            <div style={styles.successBox}>
              <p style={{ fontSize: '14px', color: '#2D6A4F', margin: 0 }}>
                Tu correo ha sido verificado correctamente. Ya puedes ingresar a tu cuenta.
              </p>
            </div>
            <Link to="/login" style={styles.button}>
              Ir al inicio de sesión
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <>
            <div style={styles.stateIcon}>❌</div>
            <h1 style={styles.heading}>Enlace inválido</h1>
            <div style={styles.errorBox}>{errorMsg}</div>
            <p style={styles.text}>El enlace puede haber expirado (válido 24 h) o ya fue usado.</p>
            <Link to="/register" style={styles.link}>
              ← Volver al registro
            </Link>
          </>
        )}

        {/* ── Token ausente ── */}
        {status === 'missing' && (
          <>
            <div style={styles.stateIcon}>🔗</div>
            <h1 style={styles.heading}>Enlace incompleto</h1>
            <p style={styles.text}>
              No encontramos un token de verificación en esta URL. Usa el enlace que recibiste en tu
              correo electrónico.
            </p>
            <Link to="/login" style={styles.link}>
              ← Ir al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

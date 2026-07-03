import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '../hooks/useResetPassword'

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
  logoIcon: { width: '48px', height: '48px' },
  brand: { fontSize: '22px', fontWeight: '700', color: '#2D6A4F', letterSpacing: '-0.5px' },
  heading: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1C1C1C',
    marginBottom: '6px',
    letterSpacing: '-0.3px',
  },
  subheading: { fontSize: '14px', color: '#6B6B6B', marginBottom: '32px' },
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
  fieldWrap: { marginBottom: '20px' },
  hint: { fontSize: '11px', color: '#8C8C8C', marginTop: '5px' },
  strengthBar: {
    height: '4px',
    borderRadius: '2px',
    marginTop: '8px',
    transition: 'width 0.3s, background-color 0.3s',
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
    marginTop: '4px',
  },
  buttonDisabled: { backgroundColor: '#95D5B2', cursor: 'not-allowed' },
  successBox: {
    backgroundColor: '#EDFAF3',
    border: '1px solid #95D5B2',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  successIcon: { fontSize: '36px', marginBottom: '12px' },
  successTitle: { fontSize: '18px', fontWeight: '700', color: '#2D6A4F', marginBottom: '8px' },
  successText: { fontSize: '14px', color: '#3D3D3D', lineHeight: '1.5', margin: 0 },
  warningBox: {
    backgroundColor: '#FEF9EE',
    border: '1px solid #F0D9A0',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '13px',
    color: '#7A5200',
    textAlign: 'center' as const,
  },
  divider: { borderTop: '1px solid #E8E2DA', margin: '28px 0' },
  footer: { textAlign: 'center' as const, fontSize: '13px', color: '#6B6B6B' },
  footerLink: { color: '#2D6A4F', fontWeight: '600', textDecoration: 'none' },
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

/** Indicador visual de fortaleza de contraseña */
function PasswordStrength({ password }: { password: string }) {
  const len = password.length
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [len >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  const colors = ['#E0D9CF', '#C1440E', '#F0A500', '#2D6A4F']
  const labels = ['', 'Débil', 'Regular', 'Fuerte']

  if (!password) return null

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: score >= i ? colors[score] : '#E0D9CF',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: '11px', color: colors[score], margin: 0, fontWeight: '600' }}>
          {labels[score]}
        </p>
      )}
    </div>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { resetPassword, loading, error, success } = useResetPassword()
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [localError, setLocalError] = useState('')

  const inputStyle = (field: string) => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (nuevaPassword.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nuevaPassword !== confirmar) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    resetPassword({ token, nuevaPassword })
  }

  // Sin token en la URL
  if (!token) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={styles.logoWrap}>
            <RecycleIcon />
            <span style={styles.brand}>ReCircula</span>
          </div>
          <div style={styles.warningBox}>
            <p style={{ margin: 0 }}>
              Este enlace es inválido o incompleto. Solicita uno nuevo desde{' '}
              <Link to="/forgot-password" style={styles.footerLink}>
                recuperar contraseña
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <RecycleIcon />
          <span style={styles.brand}>ReCircula</span>
        </div>

        {!success ? (
          <>
            <h1 style={styles.heading}>Nueva contraseña</h1>
            <p style={styles.subheading}>Elige una contraseña segura para tu cuenta.</p>

            {(error || localError) && <div style={styles.errorBox}>{localError || error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div style={styles.fieldWrap}>
                <label htmlFor="nueva" style={styles.label}>
                  Nueva contraseña
                </label>
                <input
                  id="nueva"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  onFocus={() => setFocusedField('nueva')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('nueva')}
                  placeholder="Mínimo 8 caracteres"
                />
                <PasswordStrength password={nuevaPassword} />
              </div>

              <div style={styles.fieldWrap}>
                <label htmlFor="confirmar" style={styles.label}>
                  Confirmar contraseña
                </label>
                <input
                  id="confirmar"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  onFocus={() => setFocusedField('confirmar')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle('confirmar'),
                    ...(confirmar && confirmar !== nuevaPassword ? { borderColor: '#C1440E' } : {}),
                    ...(confirmar && confirmar === nuevaPassword ? { borderColor: '#2D6A4F' } : {}),
                  }}
                  placeholder="Repite tu contraseña"
                />
                {confirmar && confirmar !== nuevaPassword && (
                  <p style={{ ...styles.hint, color: '#C1440E' }}>Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
              >
                {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        ) : (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>🔐</div>
            <p style={styles.successTitle}>¡Contraseña actualizada!</p>
            <p style={styles.successText}>
              Tu contraseña fue cambiada exitosamente. Redirigiendo al inicio de sesión…
            </p>
          </div>
        )}

        <hr style={styles.divider} />
        <p style={styles.footer}>
          <Link to="/login" style={styles.footerLink}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

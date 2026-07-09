import { Shield, Lock, FileText, Server, EyeOff, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AvisoPrivacidadPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F4EE',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      <header style={{
        backgroundColor: '#2D6A4F',
        padding: '32px 20px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Shield size={36} color="#95D5B2" />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Aviso de Privacidad Integral</h1>
        </div>
        <p style={{ margin: 0, color: '#D8F3DC', fontSize: '1.1rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          En ReCircula, la protección de tu información personal es nuestra prioridad técnica y legal.
        </p>
      </header>
      
      <main style={{
        flex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
        color: '#2C3E50'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          lineHeight: '1.7',
          fontSize: '1.05rem'
        }}>
          <p style={{ fontSize: '14px', color: '#7F8C8D', textAlign: 'right', marginBottom: '30px', fontWeight: '500' }}>
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>
          
          <p style={{ marginBottom: '30px' }}>
            De conformidad con lo establecido en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>, 
            sus reglamentos y lineamientos, <strong>ReCircula</strong> (en adelante "El Responsable"), con domicilio en Guanajuato, México, 
            pone a su disposición el presente Aviso de Privacidad.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', marginBottom: '15px', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px' }}>
            <UserCheck color="#2D6A4F" size={24} />
            <h2 style={{ color: '#2D6A4F', margin: 0, fontSize: '1.4rem' }}>1. Datos Personales que Recabamos</h2>
          </div>
          <p>Para llevar a cabo las finalidades descritas en el presente aviso, clasificamos los datos en dos categorías:</p>
          <ul style={{ marginBottom: '20px' }}>
            <li><strong>Usuarios Generales:</strong> Nombre completo, correo electrónico, contraseña (almacenada mediante hashing criptográfico) y preferencias de búsqueda.</li>
            <li><strong>Reparadores Verificados:</strong> Además de lo anterior, recabamos datos de identificación oficial (INE, Pasaporte), constancia de situación fiscal (RFC) y comprobantes de domicilio estrictamente para validar su identidad y garantizar la seguridad de la comunidad.</li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', marginBottom: '15px', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px' }}>
            <FileText color="#2D6A4F" size={24} />
            <h2 style={{ color: '#2D6A4F', margin: 0, fontSize: '1.4rem' }}>2. Finalidades del Tratamiento</h2>
          </div>
          <p>Sus datos personales serán utilizados exclusivamente para:</p>
          <ul style={{ marginBottom: '20px' }}>
            <li><strong>Primarias:</strong> Creación de su cuenta, autenticación segura, habilitar el sistema de <em>Matchmaking</em> para conectar donantes con reparadores, y gestionar el tablero de reputación.</li>
            <li><strong>Secundarias:</strong> Envío de notificaciones por correo electrónico sobre el estado de sus transacciones, estadísticas de uso para mejorar la plataforma, y avisos de seguridad.</li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', marginBottom: '15px', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px' }}>
            <EyeOff color="#2D6A4F" size={24} />
            <h2 style={{ color: '#2D6A4F', margin: 0, fontSize: '1.4rem' }}>3. Ejercicio de Derechos ARCO y Revocación</h2>
          </div>
          <p>
            Usted tiene derecho en todo momento a <strong>Acceder</strong> a sus datos, <strong>Rectificarlos</strong> si son inexactos, 
            <strong>Cancelarlos</strong> (eliminarlos permanentemente del sistema) y <strong>Oponerse</strong> a su tratamiento.
          </p>
          <div style={{ backgroundColor: '#F8F9FA', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #2D6A4F', margin: '20px 0' }}>
            <strong>Mecanismo Automatizado:</strong> ReCircula cuenta con un panel dedicado de Privacidad ARCO dentro de su perfil. 
            Allí podrá solicitar un reporte en formato JSON de todos los datos que poseemos sobre usted (Portabilidad) o eliminar 
            su cuenta de forma irreversible con un solo clic, sin necesidad de trámites burocráticos.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', marginBottom: '15px', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px' }}>
            <Lock color="#2D6A4F" size={24} />
            <h2 style={{ color: '#2D6A4F', margin: 0, fontSize: '1.4rem' }}>4. Medidas de Seguridad y Criptografía</h2>
          </div>
          <p>Implementamos las mejores prácticas de la industria (OWASP) para proteger su información contra fugas o alteraciones:</p>
          <ul>
            <li><strong>Cifrado en Reposo:</strong> Los datos sensibles en la base de datos (como correos y documentos) se cifran utilizando algoritmos de grado militar (AES-256-GCM).</li>
            <li><strong>Cifrado en Tránsito:</strong> Toda la comunicación viaja a través de túneles seguros HTTPS/TLS 1.2+.</li>
            <li><strong>Gestión de Sesión:</strong> Sus tokens de acceso se almacenan en <em>Cookies Seguras (HttpOnly)</em>, protegiéndolo de robos por inyección de código (XSS).</li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '40px', marginBottom: '15px', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px' }}>
            <Server color="#2D6A4F" size={24} />
            <h2 style={{ color: '#2D6A4F', margin: 0, fontSize: '1.4rem' }}>5. Uso de Cookies y Rastreo</h2>
          </div>
          <p>
            Nuestra plataforma utiliza "Cookies" exclusivamente técnicas y de sesión. No vendemos su información a terceros ni utilizamos 
            cookies de rastreo publicitario (Third-Party Trackers). Su información es su propiedad.
          </p>

          <p style={{ marginTop: '50px', fontSize: '0.95rem', color: '#7F8C8D', textAlign: 'center', borderTop: '1px solid #EEEEEE', paddingTop: '30px' }}>
            Cualquier modificación a este Aviso de Privacidad será notificada a través de la interfaz principal de la aplicación.
            Para dudas técnicas o legales, contacte a <strong>privacidad@recircula.mx</strong>.
          </p>
          
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              backgroundColor: '#2D6A4F',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '30px',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(45, 106, 79, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              Entendido, volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

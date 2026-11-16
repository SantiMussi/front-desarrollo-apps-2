import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AuthShell from "../../components/auth/AuthShell";

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <AuthShell title="Registro no disponible" description="La creación de cuentas no está disponible desde Atención Ciudadana."
    footer={<Link className="font-semibold text-[#0F2C59] hover:underline" to="/ingresar">Volver a ingresar</Link>}>
    <p className="mt-8 text-sm text-slate-600">Si ya tenés una cuenta habilitada, utilizá tus datos para ingresar.</p>
  </AuthShell>;
}

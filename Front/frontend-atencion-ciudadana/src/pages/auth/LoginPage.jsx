import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthShell, { AuthField } from "../../components/auth/AuthShell";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      console.log(form)
      setError(err.message || "No pudimos completar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      description="Ingresá con los datos de tu cuenta."
      error={error}
      footer={<>¿Todavía no tenés cuenta? <Link className="font-semibold text-[#0F2C59] hover:underline" to="/registro">Registrate</Link></>}
    >
      {location.state?.message && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{location.state.message}</div>}
      <form onSubmit={submit} className="mt-8 space-y-5">
        <AuthField icon={Mail} label="Correo electrónico" name="username" type="email" value={form.username} onChange={update} autoComplete="username" />
        <AuthField icon={LockKeyhole} label="Contraseña" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} autoComplete="current-password" action={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        <button disabled={loading} className="w-full rounded-xl bg-[#D63031] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#bb292a] disabled:cursor-wait disabled:opacity-60">{loading ? "Procesando..." : "Ingresar"}</button>
      </form>
    </AuthShell>
  );
}
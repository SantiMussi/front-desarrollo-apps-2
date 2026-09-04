import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthShell, { AuthField } from "../../components/auth/AuthShell";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/ingresar", { replace: true, state: { message: "Cuenta creada. Ya podés iniciar sesión." } });
    } catch (err) {
      setError(err.message || "No pudimos completar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Creá tu cuenta"
      description="Completá tus datos para empezar."
      error={error}
      footer={<>¿Ya tenés una cuenta? <Link className="font-semibold text-[#0F2C59] hover:underline" to="/ingresar">Ingresá</Link></>}
    >
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4"><AuthField icon={UserRound} label="Nombre" name="firstName" value={form.firstName} onChange={update} /><AuthField icon={UserRound} label="Apellido" name="lastName" value={form.lastName} onChange={update} /></div>
        <AuthField icon={Mail} label="Correo electrónico" name="email" type="email" value={form.email} onChange={update} autoComplete="email" />
        <AuthField icon={LockKeyhole} label="Contraseña" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} autoComplete="new-password" action={<button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
        <button disabled={loading} className="w-full rounded-xl bg-[#D63031] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#bb292a] disabled:cursor-wait disabled:opacity-60">{loading ? "Procesando..." : "Crear cuenta"}</button>
      </form>
    </AuthShell>
  );
}
import { fireEvent, screen } from "@testing-library/react";
import { Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AuthShell, { AuthField } from "../AuthShell";
import ProtectedRoute from "../ProtectedRoute";
import { ADMIN, AGENT, CITIZEN, authFor, makeAuth, renderWithProviders } from "../../../test/renderWithProviders";

const protectedTree = (roles) => (
  <Route element={<ProtectedRoute roles={roles} />}>
    <Route path="/privado" element={<p>Contenido privado</p>} />
  </Route>
);

const renderProtected = (auth, roles, route = "/privado") =>
  renderWithProviders(<p>fallback</p>, {
    auth,
    route,
    path: "/no-match",
    extraRoutes: (
      <>
        {protectedTree(roles)}
        <Route path="/ingresar" element={<p>Pantalla de ingreso</p>} />
      </>
    ),
  });

describe("ProtectedRoute", () => {
  it("muestra un indicador mientras se valida la sesión", () => {
    renderProtected(makeAuth({ isLoading: true }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("redirige a ingresar si no hay sesión", () => {
    renderProtected(makeAuth());
    expect(screen.getByText("Pantalla de ingreso")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/ingresar");
  });

  it("deja pasar a un usuario autenticado cuando no se piden roles", () => {
    renderProtected(authFor(CITIZEN));
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("deja pasar cuando el rol está permitido", () => {
    renderProtected(authFor(AGENT), ["AGENT", "ADMIN"]);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("acepta un arreglo de roles vacío como sin restricción", () => {
    renderProtected(authFor(CITIZEN), []);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("muestra acceso denegado con el enlace de inicio correcto por rol", () => {
    renderProtected(authFor(CITIZEN), ["ADMIN"]);
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("toma el rol desde identity cuando no está en el usuario", () => {
    renderProtected(authFor({ identity: { role: "ADMIN" } }), ["ADMIN"]);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("deniega si el usuario no tiene rol", () => {
    renderProtected(authFor({ id: 1 }), ["ADMIN"]);
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
  });

  it("un administrador supera la restricción de administrador", () => {
    renderProtected(authFor(ADMIN), ["ADMIN"]);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });
});

describe("AuthShell / AuthField", () => {
  it("renderiza título, descripción, hijos, pie y error", () => {
    renderWithProviders(
      <AuthShell title="Ingresar" description="Bienvenido" error="Credenciales inválidas" footer={<span>¿Nuevo?</span>}>
        <p>formulario</p>
      </AuthShell>
    );
    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeInTheDocument();
    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Credenciales inválidas");
    expect(screen.getByText("formulario")).toBeInTheDocument();
    expect(screen.getByText("¿Nuevo?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute("href", "/");
  });

  it("no muestra la alerta sin error", () => {
    renderWithProviders(<AuthShell title="Registro" description="d" footer="pie" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AuthField conecta la etiqueta con el input y acepta una acción", () => {
    const onChange = vi.fn();
    const Icon = (props) => <svg data-testid="icono" {...props} />;
    renderWithProviders(<AuthField icon={Icon} label="Correo" name="email" onChange={onChange} action={<button type="button">ver</button>} />);
    const input = screen.getByLabelText("Correo");
    expect(input).toBeRequired();
    fireEvent.change(input, { target: { value: "a@b.c" } });
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ver" })).toBeInTheDocument();
    expect(screen.getByTestId("icono")).toBeInTheDocument();
  });
});

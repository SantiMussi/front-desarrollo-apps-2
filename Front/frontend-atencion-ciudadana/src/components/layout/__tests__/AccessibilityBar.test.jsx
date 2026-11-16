import { fireEvent, render, renderHook, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccessibilityBar from "../AccessibilityBar";
import { TEXT_ZOOM, useAccessibilityPrefs } from "../../../hooks/useAccessibilityPrefs";

beforeEach(() => localStorage.clear());

describe("AccessibilityBar", () => {
  it("marca la opción activa y avisa los cambios", () => {
    const onSizeChange = vi.fn();
    const onToggleContrast = vi.fn();
    render(<AccessibilityBar size={1} contrast={false} onSizeChange={onSizeChange} onToggleContrast={onToggleContrast} />);
    expect(screen.queryByRole("group", { name: "Opciones de accesibilidad" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accesibilidad" }));
    expect(screen.getByRole("button", { name: "Tamaño de letra grande" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tamaño de letra normal" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Tamaño de letra muy grande" }));
    expect(onSizeChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: /Alto contraste/ }));
    expect(onToggleContrast).toHaveBeenCalledOnce();
  });

  it("se cierra con Escape y al hacer clic afuera", () => {
    render(<AccessibilityBar size={0} contrast={false} onSizeChange={vi.fn()} onToggleContrast={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: "Accesibilidad" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Opciones de accesibilidad" })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("group", { name: "Opciones de accesibilidad" })).not.toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar opciones" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

describe("useAccessibilityPrefs", () => {
  it("arranca con valores neutros", () => {
    const { result } = renderHook(() => useAccessibilityPrefs());
    expect(result.current).toMatchObject({ size: 0, contrast: false, zoom: 1 });
  });

  it("guarda y recupera el tamaño y el contraste", () => {
    const first = renderHook(() => useAccessibilityPrefs());
    act(() => first.result.current.setSize(2));
    act(() => first.result.current.toggleContrast());
    expect(first.result.current).toMatchObject({ size: 2, contrast: true, zoom: TEXT_ZOOM[2] });
    first.unmount();
    const second = renderHook(() => useAccessibilityPrefs());
    expect(second.result.current).toMatchObject({ size: 2, contrast: true });
  });

  it("ignora valores guardados inválidos", () => {
    localStorage.setItem("ciudad-uade:a11y", JSON.stringify({ size: 9, contrast: "sí" }));
    const { result } = renderHook(() => useAccessibilityPrefs());
    expect(result.current).toMatchObject({ size: 0, contrast: false });
    localStorage.setItem("ciudad-uade:a11y", "{no es json");
    expect(renderHook(() => useAccessibilityPrefs()).result.current.size).toBe(0);
  });

  it("funciona aunque el almacenamiento falle", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const { result } = renderHook(() => useAccessibilityPrefs());
    act(() => result.current.setSize(1));
    expect(result.current.size).toBe(1);
    setItem.mockRestore();
  });
});

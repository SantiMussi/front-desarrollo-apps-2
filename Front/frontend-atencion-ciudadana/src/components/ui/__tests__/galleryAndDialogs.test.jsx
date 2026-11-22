import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AttachmentGallery from "../AttachmentGallery";
import ConfirmExitModal from "../ConfirmExitModal";
import DuplicateLinkDialog from "../DuplicateLinkDialog";
import LoginPromptModal from "../LoginPromptModal";
import ModalDialog from "../ModalDialog";
import { fetchDuplicateCandidates } from "../../../services/apiClient";
import { AuthContext } from "../../../context/authContext";

vi.mock("../../../services/apiClient", () => ({ fetchDuplicateCandidates: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

const file = (name = "foto.png") => new File(["x"], name, { type: "image/png" });
const selectFile = (input, files) => fireEvent.change(input, { target: { files } });

describe("AttachmentGallery", () => {
  const items = [
    { id: 1, fileName: "foto.jpg", contentType: "image/jpeg", sizeBytes: 500 },
    { id: 2, fileName: "doc.pdf", contentType: "application/pdf", sizeBytes: 2048 },
    { id: 3, fileName: "raro.bin", contentType: "application/octet-stream", sizeBytes: 3 * 1024 * 1024 },
    { id: 4, fileName: "sin-tipo", sizeBytes: undefined },
  ];

  it("lista adjuntos con tamaño legible y muestra el vacío", () => {
    const { rerender } = render(<AttachmentGallery items={items} />);
    expect(screen.getByText("500 B")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    expect(screen.getByText("3.0 MB")).toBeInTheDocument();
    expect(screen.getByText("Adjuntos")).toBeInTheDocument();
    rerender(<AttachmentGallery items={undefined} title="" />);
    expect(screen.getByText("No hay adjuntos en este ticket.")).toBeInTheDocument();
    expect(screen.queryByText("Adjuntar archivo")).not.toBeInTheDocument();
  });

  it("actualiza la lista cuando cambian los items", () => {
    const { rerender } = render(<AttachmentGallery items={[items[0]]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    rerender(<AttachmentGallery items={items} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("sube un archivo, lo agrega a la lista y restablece el input", async () => {
    const uploadFile = vi.fn().mockResolvedValue({ id: 9, fileName: "nuevo.png", contentType: "image/png", sizeBytes: 10 });
    const { container } = render(<AttachmentGallery items={[]} canUpload uploadFile={uploadFile} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", expect.not.stringContaining(".doc"));
    selectFile(input, []);
    expect(uploadFile).not.toHaveBeenCalled();
    selectFile(input, [file("nuevo.png")]);
    expect(await screen.findByText("nuevo.png")).toBeInTheDocument();
    expect(uploadFile).toHaveBeenCalledOnce();
  });

  it("acepta que el back devuelva una lista al subir y usa un accept propio", async () => {
    const uploadFile = vi.fn().mockResolvedValue([{ id: 7, fileName: "a.pdf" }, { id: 8, fileName: "b.pdf" }]);
    const { container } = render(<AttachmentGallery items={[]} canUpload accept=".pdf" uploadFile={uploadFile} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", ".pdf");
    selectFile(input, [file("a.pdf")]);
    expect(await screen.findByText("b.pdf")).toBeInTheDocument();
  });

  it("muestra 'Subiendo…' mientras se sube", async () => {
    let finish;
    const uploadFile = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const { container } = render(<AttachmentGallery items={[]} canUpload uploadFile={uploadFile} />);
    selectFile(container.querySelector('input[type="file"]'), [file()]);
    selectFile(container.querySelector('input[type="file"]'), [file()]);
    expect(await screen.findByText("Subiendo…")).toBeInTheDocument();
    expect(uploadFile).toHaveBeenCalledTimes(1);
    await act(async () => finish({ id: 1, fileName: "ok.png" }));
    expect(screen.getByText("Adjuntar archivo")).toBeInTheDocument();
  });

  it("rechaza formato no soportado y exceso de tamaño antes de subir", () => {
    const uploadFile = vi.fn();
    const { container } = render(<AttachmentGallery items={[]} canUpload uploadFile={uploadFile} />);
    const input = container.querySelector('input[type="file"]');
    selectFile(input, [new File(["doc"], "bad.doc", { type: "application/msword" })]);
    expect(screen.getByText(/Formato no admitido/)).toBeInTheDocument();
    const oversized = file(); Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    selectFile(input, [oversized]);
    expect(screen.getByText(/10 MiB/)).toBeInTheDocument();
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it.each([
    [413, /tamaño máximo/],
    [415, /tipo de archivo/],
    [403, /No tenés permiso para adjuntar/],
    [401, /sesión no es válida/],
    [503, /almacenamiento de adjuntos/],
    [500, /Fallo interno/],
  ])("traduce el error de subida %s", async (status, pattern) => {
    const uploadFile = vi.fn().mockRejectedValue(Object.assign(new Error("Fallo interno"), { status }));
    const { container } = render(<AttachmentGallery items={[]} canUpload uploadFile={uploadFile} />);
    selectFile(container.querySelector('input[type="file"]'), [file()]);
    expect(await screen.findByText(pattern)).toBeInTheDocument();
  });

  it("usa un mensaje genérico si el error de subida no trae texto", async () => {
    const uploadFile = vi.fn().mockRejectedValue({});
    const { container } = render(<AttachmentGallery items={[]} canUpload uploadFile={uploadFile} />);
    selectFile(container.querySelector('input[type="file"]'), [file()]);
    expect(await screen.findByText("No pudimos subir el archivo. Intentá de nuevo.")).toBeInTheDocument();
  });

  it("descarga un adjunto creando un enlace temporal", async () => {
    const downloadFile = vi.fn().mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:1");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<AttachmentGallery items={items} downloadFile={downloadFile} />);
    fireEvent.click(screen.getByLabelText("Descargar foto.jpg"));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1"));
    expect(downloadFile).toHaveBeenCalledWith(items[0]);
    expect(click).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Descargar sin-tipo"));
    await waitFor(() => expect(downloadFile).toHaveBeenCalledTimes(2));
    click.mockRestore();
  });

  it.each(["Escape", "botón"])("previsualiza imágenes y PDF en un visor y libera la URL al cerrar con %s", async (closeWith) => {
    const downloadFile = vi.fn().mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:prev");
    URL.revokeObjectURL = vi.fn();
    const pdf = { id: 9, fileName: "acta.pdf", contentType: "application/pdf", sizeBytes: 10 };
    render(<AttachmentGallery items={[pdf]} downloadFile={downloadFile} />);
    // La descarga es asíncrona: esperar también los efectos que registran Escape.
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ver acta.pdf"));
    });
    expect(await screen.findByRole("dialog", { name: "Vista previa de acta.pdf" })).toBeInTheDocument();
    expect(screen.getByTitle("PDF acta.pdf")).toHaveAttribute("src", "blob:prev");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Vista previa de acta.pdf" })).toBeInTheDocument();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    if (closeWith === "Escape") fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    else fireEvent.click(screen.getByLabelText("Cerrar vista previa"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:prev");
  });

  it("muestra una imagen en la vista previa y no ofrece ver formatos no soportados", async () => {
    const downloadFile = vi.fn().mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:img");
    URL.revokeObjectURL = vi.fn();
    const list = [
      { id: 1, fileName: "foto.png", contentType: "image/png", sizeBytes: 1 },
      { id: 2, fileName: "cel.heic", contentType: "image/heic", sizeBytes: 1 },
    ];
    render(<AttachmentGallery items={list} downloadFile={downloadFile} />);
    expect(screen.queryByLabelText("Ver cel.heic")).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ver foto.png"));
    });
    expect(await screen.findByAltText("foto.png")).toHaveAttribute("src", "blob:img");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Cerrar vista previa"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:img");
  });

  it("muestra el error si falla la carga de la vista previa", async () => {
    const downloadFile = vi.fn().mockRejectedValue({ status: 404 });
    const list = [{ id: 1, fileName: "foto.png", contentType: "image/png", sizeBytes: 1 }];
    render(<AttachmentGallery items={list} downloadFile={downloadFile} />);
    fireEvent.click(screen.getByLabelText("Ver foto.png"));
    expect(await screen.findByText(/No encontramos ese adjunto/)).toBeInTheDocument();
  });

  it("usa un nombre por defecto si el adjunto no tiene nombre", async () => {
    const downloadFile = vi.fn().mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:2");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<AttachmentGallery items={[{ id: 5 }]} downloadFile={downloadFile} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalled());
    click.mockRestore();
  });

  it.each([
    [404, /No encontramos ese adjunto/],
    [403, /No tenés permiso para descargar/],
    [401, /sesión no es válida/],
    [500, /Explotó/],
  ])("traduce el error de descarga %s", async (status, pattern) => {
    const downloadFile = vi.fn().mockRejectedValue(Object.assign(new Error("Explotó"), { status }));
    render(<AttachmentGallery items={items} downloadFile={downloadFile} />);
    fireEvent.click(screen.getByLabelText("Descargar foto.jpg"));
    expect(await screen.findByText(pattern)).toBeInTheDocument();
  });

  it("usa un mensaje genérico si el error de descarga no trae texto", async () => {
    const downloadFile = vi.fn().mockRejectedValue({});
    render(<AttachmentGallery items={items} downloadFile={downloadFile} />);
    fireEvent.click(screen.getByLabelText("Descargar foto.jpg"));
    expect(await screen.findByText("No pudimos descargar el archivo.")).toBeInTheDocument();
  });
});

describe("ModalDialog", () => {
  afterEach(() => vi.restoreAllMocks());

  // jsdom no calcula la geometría. El foco, los eventos y la visibilidad CSS son reales.
  function renderedControls(...labels) {
    for (const label of labels) {
      vi.spyOn(screen.getByText(label), "getClientRects").mockReturnValue([{ width: 80, height: 24 }]);
    }
  }

  it.each([true, false])("abre el diálogo, enfoca el control y restaura el scroll (lockScroll=%s)", (lockScroll) => {
    const initialFocusRef = createRef();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "scroll";
    try {
      const { unmount } = render(
        <ModalDialog label="Editar reclamo" initialFocusRef={initialFocusRef} lockScroll={lockScroll}>
          <button type="button">Cancelar</button>
          <input ref={initialFocusRef} aria-label="Título" />
        </ModalDialog>,
      );
      const dialog = screen.getByRole("dialog", { name: "Editar reclamo" });
      expect(dialog).toHaveAttribute("open");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(screen.getByRole("textbox", { name: "Título" })).toHaveFocus();
      expect(document.body.style.overflow).toBe(lockScroll ? "hidden" : "scroll");
      unmount();
      expect(dialog).not.toHaveAttribute("open");
      expect(document.body.style.overflow).toBe("scroll");
    } finally {
      document.body.style.overflow = originalOverflow;
    }
  });

  it("cicla Tab en ambos extremos y excluye controles fuera del orden de tabulación", () => {
    render(
      <ModalDialog label="Editar reclamo">
        <button type="button" tabIndex={-1}>Foco programático</button>
        <button type="button">Primero</button>
        <button type="button">Intermedio</button>
        <button type="button">Último</button>
        <button type="button" disabled>Acción deshabilitada</button>
        <button type="button" hidden>Acción sin caja</button>
        <button type="button" style={{ visibility: "hidden" }}>Acción invisible</button>
      </ModalDialog>,
    );
    renderedControls("Foco programático", "Primero", "Intermedio", "Último", "Acción deshabilitada", "Acción invisible");
    const first = screen.getByRole("button", { name: "Primero" });
    const middle = screen.getByRole("button", { name: "Intermedio" });
    const last = screen.getByRole("button", { name: "Último" });

    last.focus();
    expect(fireEvent.keyDown(last, { key: "Tab" })).toBe(false);
    expect(first).toHaveFocus();
    expect(fireEvent.keyDown(first, { key: "Tab", shiftKey: true })).toBe(false);
    expect(last).toHaveFocus();

    middle.focus();
    expect(fireEvent.keyDown(middle, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(middle, { key: "Tab", shiftKey: true })).toBe(true);
    expect(middle).toHaveFocus();
  });

  it("deja pasar otras teclas y respeta un Tab manejado por un control interno", () => {
    render(
      <ModalDialog label="Editar reclamo">
        <button type="button">Cancelar</button>
        <button type="button" onKeyDown={(event) => {
          if (event.key === "Tab") event.preventDefault();
        }}>Acción con teclado propio</button>
      </ModalDialog>,
    );
    renderedControls("Cancelar", "Acción con teclado propio");
    const control = screen.getByRole("button", { name: "Acción con teclado propio" });
    control.focus();

    expect(fireEvent.keyDown(control, { key: "ArrowRight" })).toBe(true);
    expect(fireEvent.keyDown(control, { key: "Tab" })).toBe(false);
    expect(control).toHaveFocus();
  });

  it.each([true, false])("controla Escape y el clic de fondo (canDismiss=%s)", (canDismiss) => {
    const onDismiss = vi.fn();
    render(<ModalDialog label="Editar reclamo" canDismiss={canDismiss} onDismiss={onDismiss} />);
    const dialog = screen.getByRole("dialog", { name: "Editar reclamo" });
    const backdrop = dialog.querySelector("button[aria-hidden='true']");
    expect(fireEvent(dialog, new Event("cancel", { cancelable: true }))).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(canDismiss ? 1 : 0);
    expect(backdrop.disabled).toBe(!canDismiss);
    fireEvent.click(backdrop);
    expect(onDismiss).toHaveBeenCalledTimes(canDismiss ? 2 : 0);
    expect(dialog).toHaveAttribute("open");
  });
});

describe("ConfirmExitModal", () => {
  it("no renderiza nada cerrado y libera el scroll", () => {
    render(<ConfirmExitModal isOpen={false} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText("¿Querés salir del formulario?")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("bloquea el scroll, confirma, cancela y cierra con Escape", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { unmount } = render(<ConfirmExitModal isOpen onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole("alertdialog", { name: "¿Querés salir del formulario?" });
    expect(dialog).toHaveAccessibleDescription(/todo el progreso/);
    expect(screen.getByRole("button", { name: "Seguir editando" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByText("Sí, salir"));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText("Seguir editando"));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(fireEvent(dialog, new Event("cancel", { cancelable: true }))).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(3);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("cancela al hacer clic en el fondo", () => {
    const onCancel = vi.fn();
    render(<ConfirmExitModal isOpen onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("alertdialog").querySelector("button[aria-hidden='true']"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe("LoginPromptModal", () => {
  const setup = (login = vi.fn().mockResolvedValue({}), props = {}) => {
    const onClose = vi.fn();
    const onAuthenticated = vi.fn();
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login }}>
          <LoginPromptModal isOpen onClose={onClose} onAuthenticated={onAuthenticated} {...props} />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    return { login, onClose, onAuthenticated };
  };
  const fill = () => {
    fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { name: "username", value: "a@b.c" } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { name: "password", value: "secreta" } });
  };

  it("no muestra nada cerrado", () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: vi.fn() }}>
          <LoginPromptModal isOpen={false} onClose={() => {}} onAuthenticated={() => {}} />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.queryByText(/Iniciá sesión para enviar/)).not.toBeInTheDocument();
  });

  it("inicia sesión y avisa que se autenticó", async () => {
    const { login, onAuthenticated } = setup();
    fill();
    fireEvent.click(screen.getByText("Iniciar sesión y enviar"));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce());
    expect(login).toHaveBeenCalledWith({ username: "a@b.c", password: "secreta" });
  });

  it("muestra el error del servidor y uno genérico", async () => {
    const login = vi.fn().mockRejectedValueOnce(new Error("Credenciales inválidas")).mockRejectedValueOnce({});
    setup(login);
    fill();
    fireEvent.click(screen.getByText("Iniciar sesión y enviar"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
    fireEvent.click(screen.getByText("Iniciar sesión y enviar"));
    expect(await screen.findByText("No pudimos iniciar sesión. Intentá de nuevo.")).toBeInTheDocument();
  });

  it("alterna la visibilidad de la contraseña", () => {
    setup();
    const input = screen.getByLabelText(/Contraseña/);
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByLabelText("Mostrar contraseña"));
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByLabelText("Ocultar contraseña"));
    expect(input).toHaveAttribute("type", "password");
  });

  it("se cierra con la X, Escape y el fondo", () => {
    const { onClose } = setup();
    const dialog = screen.getByRole("dialog", { name: "Iniciá sesión para enviar tu reclamo" });
    expect(dialog).toHaveAccessibleDescription(/No vas a perder/);
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveFocus();
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(fireEvent(dialog, new Event("cancel", { cancelable: true }))).toBe(false);
    fireEvent.click(dialog.querySelector("button[aria-hidden='true']"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("no se puede cerrar mientras inicia sesión", async () => {
    let finish;
    const login = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const { onClose, onAuthenticated } = setup(login);
    fill();
    fireEvent.click(screen.getByText("Iniciar sesión y enviar"));
    expect(await screen.findByText("Ingresando...")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Iniciá sesión para enviar tu reclamo" });
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(fireEvent(dialog, new Event("cancel", { cancelable: true }))).toBe(false);
    const backdrop = dialog.querySelector("button[aria-hidden='true']");
    expect(backdrop).toBeDisabled();
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => finish({}));
    expect(onAuthenticated).toHaveBeenCalled();
  });
});

describe("DuplicateLinkDialog", () => {
  const ticket = { id: 1, publicId: "TK-001", neighborhoodName: "Belgrano" };
  const candidates = Array.from({ length: 7 }, (_, index) => ({
    ticketId: 100 + index,
    publicId: `TK-${100 + index}`,
    summary: index === 6 ? "Poste caído en la esquina" : `Luminaria ${index}`,
    requestTypeName: index === 0 ? undefined : "Alumbrado",
    currentStatus: index === 1 ? "ESTADO_RARO" : "REGISTERED",
    neighborhoodName: index === 0 ? undefined : "Belgrano",
    createdAt: "2026-03-10T12:00:00Z",
    distanceMeters: [null, 250, 1500, undefined, 80, 999, 3000][index],
    timeDifferenceMinutes: [null, 30, 180, 3000, undefined, 15, 61][index],
  }));

  const setup = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<DuplicateLinkDialog ticket={ticket} onCancel={onCancel} onConfirm={onConfirm} {...props} />);
    return { onCancel, onConfirm };
  };

  it("muestra el cargando y luego los sugeridos y el resto buscable", async () => {
    fetchDuplicateCandidates.mockResolvedValue(candidates);
    const { onConfirm } = setup();
    expect(fetchDuplicateCandidates).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Sugeridos")).toBeInTheDocument();
    expect(screen.getByText("Seleccioná un ticket principal.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar vínculo/ })).toBeDisabled();
    expect(screen.getByText("250 m")).toBeInTheDocument();
    expect(screen.getByText("1.5 km")).toBeInTheDocument();
    expect(screen.getByText("30 min de diferencia")).toBeInTheDocument();
    expect(screen.getByText("3.0 h de diferencia")).toBeInTheDocument();
    expect(screen.getByText("2.1 días de diferencia")).toBeInTheDocument();
    expect(screen.getByText("Sin tipo")).toBeInTheDocument();
    expect(screen.getByText("ESTADO_RARO")).toBeInTheDocument();

    fireEvent.click(screen.getByText("TK-101").closest("button"));
    expect(screen.getByText("TK-101", { selector: "strong" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirmar vínculo/ }));
    expect(onConfirm).toHaveBeenCalledWith({ mainTicketId: 101, mainTicketPublicId: "TK-101" });
  });

  it("filtra los no sugeridos por búsqueda y permite elegir uno", async () => {
    fetchDuplicateCandidates.mockResolvedValue(candidates);
    setup();
    await screen.findByText("Sugeridos");
    const search = screen.getByPlaceholderText(/Buscar por N° de ticket/);
    expect(screen.getByText("TK-105")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "poste" } });
    expect(screen.queryByText("TK-105")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("TK-106").closest("button"));
    expect(screen.getByText("TK-106", { selector: "strong" })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "no existe" } });
    expect(screen.getByText("Sin resultados para esa búsqueda.")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByText("TK-105")).toBeInTheDocument();
  });

  it("avisa cuando no hay más tickets fuera de los sugeridos", async () => {
    fetchDuplicateCandidates.mockResolvedValue(candidates.slice(0, 2));
    setup();
    expect(await screen.findByText("No hay más tickets disponibles.")).toBeInTheDocument();
  });

  it("explica el vacío según haya ubicación o no", async () => {
    fetchDuplicateCandidates.mockResolvedValue([]);
    setup();
    expect(await screen.findByText(/No encontramos tickets similares cerca/)).toBeInTheDocument();
  });

  it("explica el vacío cuando el ticket no tiene ubicación", async () => {
    fetchDuplicateCandidates.mockResolvedValue(null);
    setup({ ticket: { id: 2, publicId: "TK-002" } });
    expect(await screen.findByText(/no tiene una ubicación cargada/)).toBeInTheDocument();
  });

  it("muestra el error de carga", async () => {
    fetchDuplicateCandidates.mockRejectedValue(new Error("x"));
    setup();
    expect(await screen.findByText(/No pudimos cargar los tickets para sugerir/)).toBeInTheDocument();
  });

  it("muestra el error de la vinculación y se cancela de todas las formas", async () => {
    fetchDuplicateCandidates.mockResolvedValue(candidates.slice(0, 2));
    const { onCancel } = setup({ error: "No se pudo vincular" });
    await screen.findByText("Sugeridos");
    expect(screen.getByText("No se pudo vincular")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByLabelText("Cerrar"));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "z" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(4);
  });

  it("bloquea las acciones mientras vincula", async () => {
    fetchDuplicateCandidates.mockResolvedValue(candidates.slice(0, 2));
    const { onCancel } = setup({ loading: true });
    await screen.findByText("Sugeridos");
    fireEvent.click(screen.getByText("TK-100").closest("button"));
    expect(screen.getByText("Vinculando…").closest("button")).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("ignora la respuesta si se desmonta antes de cargar", async () => {
    let resolve;
    fetchDuplicateCandidates.mockReturnValue(new Promise((res) => (resolve = res)));
    const { unmount } = render(<DuplicateLinkDialog ticket={ticket} onCancel={() => {}} onConfirm={() => {}} />);
    unmount();
    await act(async () => resolve(candidates));
    let reject;
    fetchDuplicateCandidates.mockReturnValue(new Promise((_, rej) => (reject = rej)));
    const second = render(<DuplicateLinkDialog ticket={ticket} onCancel={() => {}} onConfirm={() => {}} />);
    second.unmount();
    await act(async () => reject(new Error("tarde")));
  });
});

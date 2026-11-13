import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CitizenTicketView from "../components/ticket/CitizenTicketView";
import AttachmentGallery from "../components/ui/AttachmentGallery";

// Payloads típicos de OWASP para XSS. Si el front los interpretara como HTML,
// aparecerían elementos <script>, <img>, <svg> o atributos on* dentro del DOM.
const PAYLOADS = [
  "<script>alert(1)</script>",
  '"><img src=x onerror=alert(1)>',
  "<svg/onload=alert(1)>",
  "<a href=\"javascript:alert(1)\">clic</a>",
  "<iframe src=\"javascript:alert(1)\"></iframe>",
];

function injectedNodes(container) {
  const dangerous = container.querySelectorAll("script, iframe, svg[onload], img[onerror], a[href^='javascript:']");
  const withHandlers = [...container.querySelectorAll("*")].filter((node) =>
    [...node.attributes].some((attribute) => attribute.name.toLowerCase().startsWith("on"))
  );
  return [...dangerous, ...withHandlers];
}

const ticketWith = (payload) => ({
  id: 5,
  publicId: "TK-000012",
  currentStatus: "IN_PROGRESS",
  summary: payload,
  description: payload,
  ticketType: "COMPLAINT",
  createdAt: "2026-03-10T12:00:00Z",
  statusChangedAt: "2026-03-11T15:30:00Z",
  requestType: { name: "Luminaria" },
  category: { name: "Alumbrado" },
  subcategory: { name: "Público" },
  neighborhoodName: "Belgrano",
  location: { addressLine: payload },
  attachments: [],
  history: [{ id: "h1", newStatus: "REGISTERED", occurredAt: "2026-03-10T12:00:00Z", message: payload }],
  rating: null,
});

const chatWith = (payload) => ({
  items: [
    { id: 1, authorType: "CITIZEN", authorId: "me", text: payload, createdAt: "2026-03-10T12:00:00Z" },
    { id: 2, authorType: "AGENT", authorId: "ag", text: payload, createdAt: "2026-03-10T13:00:00Z" },
    { id: 3, authorType: "SYSTEM", text: payload, createdAt: "2026-03-10T14:00:00Z" },
  ],
  loading: false,
  error: null,
  canSend: true,
  currentAuthorId: "me",
  onSend: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
});

describe("XSS: el front muestra como texto lo que escribe el usuario", () => {
  it.each(PAYLOADS)("resumen, descripción, dirección, historial y mensajes: %s", (payload) => {
    const { container } = render(
      <CitizenTicketView ticket={ticketWith(payload)} chat={chatWith(payload)} />,
      { wrapper: MemoryRouter }
    );

    expect(injectedNodes(container)).toEqual([]);
    // El texto del payload aparece literal (escapado), no interpretado.
    expect(screen.getAllByText(payload, { exact: false }).length).toBeGreaterThanOrEqual(3);
  });

  it("un adjunto declarado como HTML o SVG no ofrece vista previa, sólo descarga", () => {
    const attachments = [
      { id: 1, fileName: "pagina.html", contentType: "text/html", sizeBytes: 10 },
      { id: 2, fileName: "dibujo.svg", contentType: "image/svg+xml", sizeBytes: 10 },
      { id: 3, fileName: "foto.png", contentType: "image/png", sizeBytes: 10 },
    ];
    render(<AttachmentGallery items={attachments} downloadFile={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Ver pagina.html" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver dibujo.svg" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver foto.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar pagina.html" })).toBeInTheDocument();
  });

  it("el nombre de archivo con HTML se muestra como texto", () => {
    const name = "<img src=x onerror=alert(1)>.png";
    const { container } = render(
      <AttachmentGallery items={[{ id: 9, fileName: name, contentType: "image/png", sizeBytes: 10 }]} downloadFile={vi.fn()} />
    );

    expect(injectedNodes(container)).toEqual([]);
    expect(screen.getByText(name)).toBeInTheDocument();
  });
});

describe("XSS: ninguna API que inserte HTML crudo en el código de la aplicación", () => {
  const sources = import.meta.glob("/src/**/*.{js,jsx}", { query: "?raw", import: "default", eager: true });
  const productionFiles = Object.entries(sources).filter(
    ([path]) => !/\.test\.|__tests__|\/test\//.test(path)
  );

  it("encuentra los archivos de producción a revisar", () => {
    expect(productionFiles.length).toBeGreaterThan(50);
  });

  it.each([
    ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/],
    ["innerHTML / outerHTML", /\.(inner|outer)HTML\s*=/],
    ["insertAdjacentHTML", /insertAdjacentHTML/],
    ["document.write", /document\.write\(/],
    ["eval / new Function", /\beval\(|new Function\(/],
  ])("no usa %s", (_name, pattern) => {
    const offenders = productionFiles.filter(([, content]) => pattern.test(content)).map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

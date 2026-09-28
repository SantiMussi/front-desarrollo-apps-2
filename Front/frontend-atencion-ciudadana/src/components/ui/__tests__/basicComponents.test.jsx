import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessDenied from "../AccessDenied";
import Alert from "../Alert";
import Breadcrumb from "../Breadcrumb";
import CategoryCard from "../CategoryCard";
import DetailCard from "../DetailCard";
import DuplicateLinkIndicator from "../DuplicateLinkIndicator";
import PageHeader from "../PageHeader";
import SearchBar from "../SearchBar";
import Select from "../Select";
import Spinner from "../Spinner";
import SplashScreen from "../SplashScreen";
import StatusBadge from "../StatusBadge";
import StatusTransitionMenu from "../StatusTransitionMenu";
import StepIndicator from "../StepIndicator";
import UserAvatar from "../UserAvatar";

afterEach(() => {
  vi.useRealTimers();
});

describe("AccessDenied", () => {
  it.each([
    ["AGENT", "/agente/tickets"],
    ["ADMIN", "/agente/tickets"],
    ["CITIZEN", "/"],
    [undefined, "/"],
    ["OTRO", "/"],
  ])("el rol %s vuelve a %s", (role, path) => {
    render(
      <MemoryRouter>
        <AccessDenied role={role} />
      </MemoryRouter>
    );
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", path);
  });
});

describe("Alert", () => {
  it.each(["success", "error", "info"])("renderiza la variante %s con título", (variant) => {
    render(<Alert variant={variant} title="Título">Mensaje</Alert>);
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Mensaje")).toBeInTheDocument();
  });

  it("usa info por defecto, sin título ni botón de cierre", () => {
    render(<Alert>Solo texto</Alert>);
    expect(screen.queryByLabelText("Cerrar")).not.toBeInTheDocument();
  });

  it("puede ser sticky y se cierra con el botón", () => {
    const onDismiss = vi.fn();
    const { container } = render(<Alert sticky onDismiss={onDismiss}>Hola</Alert>);
    expect(container.firstChild).toHaveClass("sticky");
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("se cierra solo tras el tiempo indicado y muestra la barra de cuenta regresiva", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { container, rerender } = render(<Alert variant="error" autoDismissMs={3000} onDismiss={onDismiss}>Chau</Alert>);
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(onDismiss).toHaveBeenCalledOnce();
    rerender(<Alert variant="info" autoDismissMs={3000} onDismiss={onDismiss}>Chau</Alert>);
    expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
  });

  it("no programa el cierre si falta onDismiss o el tiempo", () => {
    vi.useFakeTimers();
    render(<Alert autoDismissMs={1000}>Sin handler</Alert>);
    render(<Alert onDismiss={() => {}}>Sin tiempo</Alert>);
    act(() => vi.advanceTimersByTime(5000));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("Breadcrumb", () => {
  it("navega hacia atrás por niveles y marca el actual", () => {
    const onNavigate = vi.fn();
    render(<Breadcrumb items={[{ id: 1, label: "Vías" }, { label: "Bacheo" }]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Portal de Ayuda"));
    fireEvent.click(screen.getByText("Vías"));
    expect(onNavigate).toHaveBeenNthCalledWith(1, -1);
    expect(onNavigate).toHaveBeenNthCalledWith(2, 0);
    expect(screen.getByText("Bacheo").tagName).toBe("SPAN");
  });

  it("funciona sin items", () => {
    render(<Breadcrumb onNavigate={() => {}} />);
    expect(screen.getByText("Portal de Ayuda")).toBeInTheDocument();
  });
});

describe("CategoryCard", () => {
  it("muestra ícono, badge conocido y dispara onClick", () => {
    const onClick = vi.fn();
    render(<CategoryCard title="Alumbrado" description="Luces" iconName="Lightbulb" itemCount={4} badgeText="Popular" onClick={onClick} />);
    expect(screen.getByText("4 activos")).toBeInTheDocument();
    expect(screen.getByText("Popular")).toHaveClass("text-[#0F2C59]");
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("usa un ícono de respaldo y estilo neutro para badges desconocidos", () => {
    render(<CategoryCard title="X" description="Y" iconName="NoExiste" itemCount={0} badgeText="Raro" />);
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText("Raro")).toHaveClass("bg-neutral-100");
  });

  it("no muestra badge si no se indica", () => {
    render(<CategoryCard title="X" description="Y" iconName="Bus" itemCount={1} />);
    expect(screen.queryByText("Popular")).not.toBeInTheDocument();
  });
});

describe("DetailCard / PageHeader / StatusBadge / UserAvatar", () => {
  it("DetailCard renderiza con y sin ícono", () => {
    const Icon = (props) => <svg data-testid="icon" {...props} />;
    const { rerender } = render(<DetailCard title="Datos" icon={Icon} className="extra">contenido</DetailCard>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    rerender(<DetailCard title="Datos">contenido</DetailCard>);
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("PageHeader muestra título, resaltado y descripción opcionales", () => {
    const { rerender } = render(<PageHeader label="Portal" title="Ayuda" highlight="vecinal" description="Texto" />);
    expect(screen.getByText("vecinal")).toBeInTheDocument();
    expect(screen.getByText("Texto")).toBeInTheDocument();
    rerender(<PageHeader label="Portal" title="Ayuda" />);
    expect(screen.queryByText("vecinal")).not.toBeInTheDocument();
  });

  it.each([
    ["Registrado", "orange"],
    ["En revisión", "blue"],
    ["En gestión", "blue"],
    ["Derivado", "blue"],
    ["Pendiente de información", "blue"],
    ["Resuelto", "green"],
    ["Cerrado", "slate-200"],
    ["Cerrado (Duplicado)", "slate-200"],
    ["Cancelado", "slate-200"],
    ["Desconocido", "slate-100"],
  ])("StatusBadge %s usa el color %s", (status, colour) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status).className).toContain(colour);
  });

  it("UserAvatar calcula iniciales desde distintos campos", () => {
    const { rerender } = render(<UserAvatar user={{ firstName: "Ana", lastName: "Pérez" }} />);
    expect(screen.getByText("AP")).toBeInTheDocument();
    rerender(<UserAvatar user={{ displayName: "Juan Carlos Gómez" }} size="sm" />);
    expect(screen.getByText("JC")).toBeInTheDocument();
    rerender(<UserAvatar user={{ nombre: "Luz", apellido: "Sosa" }} />);
    expect(screen.getByText("LS")).toBeInTheDocument();
    rerender(<UserAvatar user={{ name: "Mia", initials: "XX" }} />);
    expect(screen.getByText("XX")).toBeInTheDocument();
    rerender(<UserAvatar user={{ email: "zeta@x.com" }} />);
    expect(screen.getByText("Z")).toBeInTheDocument();
    rerender(<UserAvatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("UserAvatar muestra la imagen cuando existe", () => {
    render(<UserAvatar user={{ firstName: "Ana", avatarUrl: "http://x/a.png" }} />);
    expect(screen.getByRole("img", { name: "Avatar de Ana" })).toHaveAttribute("src", "http://x/a.png");
  });
});

describe("DuplicateLinkIndicator", () => {
  const renderIndicator = (linkInfo) =>
    render(
      <MemoryRouter>
        <DuplicateLinkIndicator linkInfo={linkInfo} />
      </MemoryRouter>
    );

  it.each([[undefined], [null], [{}], [{ isDuplicate: false, duplicateTicketsCount: 0 }]])("no muestra nada para %j", (info) => {
    const { container } = renderIndicator(info);
    expect(container).toBeEmptyDOMElement();
  });

  it("enlaza al ticket principal con su código público", () => {
    renderIndicator({ isDuplicate: true, mainTicketId: 5, mainTicketPublicId: "TK-005" });
    const link = screen.getByRole("link", { name: /Duplicado de TK-005/ });
    expect(link).toHaveAttribute("href", "/agente/tickets/5");
    expect(link).toHaveAttribute("title", "Ir al ticket principal TK-005");
    fireEvent.click(link);
  });

  it("enlaza sin código público", () => {
    renderIndicator({ isDuplicate: true, mainTicketId: 5 });
    expect(screen.getByRole("link", { name: /Duplicado/ })).toHaveAttribute("title", "Ir al ticket principal");
  });

  it("muestra una insignia sin enlace si no se conoce el principal", () => {
    renderIndicator({ isDuplicate: true });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByTitle("Vinculado a un ticket principal")).toBeInTheDocument();
  });

  it("cuenta los duplicados vinculados en singular y plural", () => {
    const { unmount } = renderIndicator({ duplicateTicketsCount: 1 });
    expect(screen.getByText("1 duplicado")).toBeInTheDocument();
    unmount();
    renderIndicator({ duplicateTicketsCount: 3 });
    expect(screen.getByText("3 duplicados")).toBeInTheDocument();
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="loc">{location.pathname + location.search}</output>;
}

describe("SearchBar", () => {
  const renderBar = (entry = "/") =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <SearchBar />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

  it("navega al portal con la búsqueda codificada", () => {
    renderBar();
    fireEvent.change(screen.getByPlaceholderText(/Buscá/), { target: { value: "  alumbrado público " } });
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/portal-ayuda?q=alumbrado%20p%C3%BAblico");
  });

  it("navega al portal sin parámetros cuando la búsqueda está vacía", () => {
    renderBar("/?q=algo");
    expect(screen.getByPlaceholderText(/Buscá/)).toHaveValue("algo");
    fireEvent.change(screen.getByPlaceholderText(/Buscá/), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }));
    expect(screen.getByTestId("loc")).toHaveTextContent(/^\/portal-ayuda$/);
  });
});

describe("Select", () => {
  const options = [
    { value: 1, label: "Uno" },
    { value: 2, label: "Dos" },
  ];

  it("muestra el placeholder, abre la lista y elige una opción", () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={onChange} options={options} ariaLabel="Número" className="w-40" />);
    expect(screen.getByText("Seleccionar…")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Número"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Dos" }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marca la opción seleccionada comparando como texto", () => {
    render(<Select value="2" onChange={() => {}} options={options} placeholder="Elegí" size="xs" />);
    expect(screen.getByText("Dos")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("option", { name: "Dos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Uno" })).toHaveAttribute("aria-selected", "false");
  });

  it("cae en el tamaño por defecto ante un tamaño desconocido y usa el placeholder propio", () => {
    render(<Select value="" onChange={() => {}} options={options} size="xl" placeholder="Nada" />);
    expect(screen.getByText("Nada")).toBeInTheDocument();
  });

  it("cierra al hacer clic fuera pero no al hacer clic dentro", () => {
    render(
      <div>
        <Select value="" onChange={() => {}} options={options} />
        <p>afuera</p>
      </div>
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.mouseDown(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("afuera"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("no abre cuando está deshabilitado", () => {
    render(<Select value="" onChange={() => {}} options={options} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Spinner", () => {
  it("renderiza la versión pequeña", () => {
    render(<Spinner size="sm" className="extra" />);
    expect(screen.getByRole("status", { name: "Cargando" })).toHaveClass("extra");
  });

  it("renderiza md y lg y rota el ícono con el tiempo", () => {
    vi.useFakeTimers();
    let tick = 0;
    vi.spyOn(Math, "random").mockImplementation(() => ((tick++ % 8) + 0.5) / 8);
    const { rerender, container, unmount } = render(<Spinner />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    const firstIcon = container.querySelector("svg").getAttribute("class");
    act(() => vi.advanceTimersByTime(750));
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector("svg").getAttribute("class")).toBeDefined();
    expect(firstIcon).toBeDefined();
    rerender(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.restoreAllMocks();
  });
});

describe("SplashScreen", () => {
  it("rota íconos, se desvanece y avisa cuando termina", () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    const { container, unmount } = render(<SplashScreen onFinish={onFinish} />);
    expect(screen.getByText("Atención Ciudadana")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("opacity-100");
    act(() => vi.advanceTimersByTime(560));
    act(() => vi.advanceTimersByTime(1200));
    expect(container.firstChild).toHaveClass("opacity-0");
    expect(onFinish).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(onFinish).toHaveBeenCalledOnce();
    unmount();
  });

  it("vuelve al primer ícono tras recorrerlos todos", () => {
    vi.useFakeTimers();
    render(<SplashScreen onFinish={() => {}} />);
    act(() => vi.advanceTimersByTime(280 * 9));
    expect(screen.getByText("Preparando tu portal...")).toBeInTheDocument();
  });
});

describe("StepIndicator", () => {
  it("marca pasos completados, actual y pendientes", () => {
    const { container } = render(<StepIndicator currentStep={2} />);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toHaveClass("font-semibold");
  });

  it("muestra éxito y error en el último paso", () => {
    const { container, rerender } = render(<StepIndicator currentStep={3} status="success" />);
    expect(container.querySelectorAll("svg")).toHaveLength(4);
    rerender(<StepIndicator currentStep={3} status="error" />);
    expect(container.querySelectorAll("svg")).toHaveLength(4);
    rerender(<StepIndicator />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("StatusTransitionMenu", () => {
  it("lista las transiciones permitidas y pide autorización antes de cambiar", () => {
    const onChange = vi.fn();
    const onTransitionRequest = vi.fn().mockReturnValue(true);
    render(<StatusTransitionMenu status="REGISTERED" onChange={onChange} onTransitionRequest={onTransitionRequest} align="left" />);
    fireEvent.click(screen.getByRole("button", { name: /Registrado/ }));
    expect(screen.getByRole("menu")).toHaveClass("left-0");
    fireEvent.click(screen.getByRole("menuitem", { name: /Empezar análisis/ }));
    expect(onTransitionRequest).toHaveBeenCalledWith("IN_REVIEW");
    expect(onChange).toHaveBeenCalledWith("IN_REVIEW");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("no cambia el estado cuando la solicitud devuelve false", () => {
    const onChange = vi.fn();
    render(<StatusTransitionMenu status="IN_REVIEW" onChange={onChange} onTransitionRequest={() => false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toHaveClass("right-0");
    fireEvent.click(screen.getByRole("menuitem", { name: /Derivar al área/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cambia directo sin onTransitionRequest y tolera la ausencia de onChange", () => {
    const onChange = vi.fn();
    const { rerender } = render(<StatusTransitionMenu status="ROUTED" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getAllByRole("menuitem")[0]);
    expect(onChange).toHaveBeenCalledWith("IN_PROGRESS");
    rerender(<StatusTransitionMenu status="PENDING_INFORMATION" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem"));
  });

  it("cierra con Escape y clic afuera, e ignora otras teclas", () => {
    render(
      <div>
        <StatusTransitionMenu status="IN_PROGRESS" />
        <p>afuera</p>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /En gestión/ }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /En gestión/ }));
    fireEvent.mouseDown(screen.getByText("afuera"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each(["RESOLVED", "CANCELLED", "CLOSED", "DESCONOCIDO"])("el estado terminal/desconocido %s no abre menú", (status) => {
    render(<StatusTransitionMenu status={status} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

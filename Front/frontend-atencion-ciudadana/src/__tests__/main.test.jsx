import { beforeEach, describe, expect, it, vi } from "vitest";

const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));

vi.mock("react-dom/client", () => ({ createRoot }));
vi.mock("../App.jsx", () => ({ default: () => <div>App</div> }));
vi.mock("../context/AuthContext.jsx", () => ({ AuthProvider: ({ children }) => <div>{children}</div> }));

beforeEach(() => {
  vi.resetModules();
  render.mockClear();
  createRoot.mockClear();
  document.body.innerHTML = '<div id="root"></div>';
});

describe("main", () => {
  it("monta la aplicación dentro de StrictMode y del proveedor de autenticación", async () => {
    await import("../main.jsx");
    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(render).toHaveBeenCalledOnce();
    const tree = render.mock.calls[0][0];
    expect(tree.type.toString()).toContain("react.strict_mode");
    expect(tree.props.children.type.name).toBe("AuthProvider");
    expect(tree.props.children.props.children.type.name).toBe("default");
  });
});

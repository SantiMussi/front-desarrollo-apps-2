import { forwardRef, useImperativeHandle } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mapApi = vi.hoisted(() => ({
  handlers: {},
  flyTo: vi.fn(),
  markerPosition: { lat: 10, lng: 20 },
  markerProps: null,
  hideHandle: false,
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: forwardRef(function Marker(props, ref) {
    mapApi.markerProps = props;
    useImperativeHandle(ref, () => (mapApi.hideHandle ? null : { getLatLng: () => mapApi.markerPosition }));
    return <div data-testid="marker" />;
  }),
  useMapEvents: (handlers) => {
    mapApi.handlers = handlers;
    return null;
  },
  useMap: () => ({ flyTo: mapApi.flyTo }),
}));

import LocationMap from "../LocationMap";

const geocodeResponse = (data, ok = true) => ({ ok, json: async () => data });

const reverseData = {
  display_name: "Av. Corrientes 1234, Buenos Aires",
  address: { road: "Av. Corrientes", house_number: "1234", suburb: "Balvanera", quarter: "Centro" },
};

let onLocationSelect;

beforeEach(() => {
  onLocationSelect = vi.fn();
  mapApi.flyTo.mockClear();
  mapApi.markerProps = null;
  mapApi.hideHandle = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderMap = (props = {}) => render(<LocationMap onLocationSelect={onLocationSelect} {...props} />);

describe("LocationMap", () => {
  it("muestra la ayuda cuando todavía no hay marcador", () => {
    renderMap();
    expect(screen.getByText(/Hacé click en el mapa/)).toBeInTheDocument();
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
    expect(screen.queryByText(/Coordenadas/)).not.toBeInTheDocument();
  });

  it("muestra el marcador con coordenadas y centra el mapa", () => {
    renderMap({ latitude: -34.6, longitude: -58.4 });
    expect(screen.getByTestId("marker")).toBeInTheDocument();
    expect(screen.getByText(/-34\.600000, -58\.400000/)).toBeInTheDocument();
    expect(mapApi.flyTo).toHaveBeenCalledWith([-34.6, -58.4], 15, { duration: 0.8 });
    expect(screen.queryByText(/Hacé click en el mapa/)).not.toBeInTheDocument();
    expect(mapApi.markerProps.draggable).toBe(true);
  });

  it("se deshabilita visualmente y no permite arrastrar", () => {
    const { container } = renderMap({ latitude: 1, longitude: 2, disabled: true });
    expect(container.querySelector(".opacity-50")).toBeInTheDocument();
    expect(mapApi.markerProps.draggable).toBe(false);
  });

  it("geocodifica al hacer clic y arma la ubicación", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geocodeResponse(reverseData)));
    renderMap();
    await act(async () => mapApi.handlers.click({ latlng: { lat: -34.6, lng: -58.4 } }));
    expect(fetch.mock.calls[0][0]).toContain("reverse?format=json&lat=-34.6&lon=-58.4");
    expect(onLocationSelect).toHaveBeenCalledWith({
      lat: -34.6,
      lng: -58.4,
      address: "Av. Corrientes 1234",
      street: "Av. Corrientes",
      streetNumber: "1234",
      neighborhoods: ["Balvanera", "Centro"],
      source: "map",
    });
  });

  it("usa el nombre del lugar cuando no hay calle y sólo la calle cuando falta el número", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geocodeResponse({ display_name: "Plaza Italia, Palermo, Buenos Aires", address: {} }))
      .mockResolvedValueOnce(geocodeResponse({ display_name: "x", address: { road: "Calle Sola" } }))
      .mockResolvedValueOnce(geocodeResponse({ display_name: "Sin dirección" }));
    vi.stubGlobal("fetch", fetchMock);
    renderMap();
    await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    expect(onLocationSelect).toHaveBeenLastCalledWith(expect.objectContaining({ address: "Plaza Italia, Palermo", street: "" }));
    await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    expect(onLocationSelect).toHaveBeenLastCalledWith(expect.objectContaining({ address: "Calle Sola", streetNumber: "" }));
    await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    expect(onLocationSelect).toHaveBeenLastCalledWith(expect.objectContaining({ address: "Sin dirección", neighborhoods: [] }));
  });

  it("devuelve una ubicación vacía cuando el geocodificador no encuentra nada o falla", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geocodeResponse({}))
      .mockResolvedValueOnce(geocodeResponse({}, false))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    renderMap();
    for (let index = 0; index < 3; index += 1) {
      await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    }
    expect(onLocationSelect).toHaveBeenCalledTimes(3);
    onLocationSelect.mock.calls.forEach(([location]) => expect(location).toMatchObject({ address: "", neighborhoods: [] }));
  });

  it("ignora los clics cuando está deshabilitado", async () => {
    vi.stubGlobal("fetch", vi.fn());
    renderMap({ disabled: true });
    await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    expect(fetch).not.toHaveBeenCalled();
    expect(onLocationSelect).not.toHaveBeenCalled();
  });

  it("actualiza la ubicación al terminar de arrastrar el marcador", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geocodeResponse(reverseData)));
    renderMap({ latitude: 1, longitude: 2 });
    await act(async () => mapApi.markerProps.eventHandlers.dragend());
    expect(onLocationSelect).toHaveBeenCalledWith(expect.objectContaining({ lat: 10, lng: 20, source: "map" }));
  });

  it("busca la dirección escrita después de una pausa y elimina la búsqueda anterior", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geocodeResponse([{ lat: "-34.5", lon: "-58.5", display_name: "Lugar", address: { neighbourhood: "Núñez", borough: "Comuna 13" } }])
      )
    );
    const { rerender } = renderMap({ address: "Av. Cabildo", streetNumber: "2000", addressSource: "input" });
    rerender(<LocationMap onLocationSelect={onLocationSelect} address="Av. Cabildo" streetNumber="2100" addressSource="input" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toContain("search?format=json");
    expect(fetch.mock.calls[0][0]).toContain(encodeURIComponent("Av. Cabildo 2100, Buenos Aires, Argentina"));
    expect(onLocationSelect).toHaveBeenCalledWith({ lat: -34.5, lng: -58.5, neighborhoods: ["Núñez", "Comuna 13"], source: "geocode" });
  });

  it("no busca si la dirección viene del mapa, es muy corta o no se escribió", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
    const { rerender } = renderMap({ address: "Av. Cabildo", addressSource: "map" });
    rerender(<LocationMap onLocationSelect={onLocationSelect} address="abc" addressSource="input" />);
    rerender(<LocationMap onLocationSelect={onLocationSelect} address="" streetNumber="  " addressSource="input" />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("no informa nada cuando la búsqueda por dirección no tiene resultados o falla", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(geocodeResponse([]))
      .mockResolvedValueOnce(geocodeResponse([], false))
      .mockRejectedValueOnce(Object.assign(new Error("abort"), { name: "AbortError" }))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = renderMap({ address: "Calle inventada 1", addressSource: "input" });
    for (const address of ["Calle inventada 2", "Calle inventada 3", "Calle inventada 4"]) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1300);
      });
      rerender(<LocationMap onLocationSelect={onLocationSelect} address={address} addressSource="input" />);
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(onLocationSelect).not.toHaveBeenCalled();
  });

  it("cancela la búsqueda en curso si el usuario hace clic en el mapa", async () => {
    vi.useFakeTimers();
    let abortSignal;
    const fetchMock = vi.fn((url, options) => {
      if (String(url).includes("/search")) {
        abortSignal = options.signal;
        return new Promise((_, reject) => {
          options.signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" })));
        });
      }
      return Promise.resolve(geocodeResponse(reverseData));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderMap({ address: "Av. Rivadavia 100", addressSource: "input" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(abortSignal.aborted).toBe(false);
    await act(async () => mapApi.handlers.click({ latlng: { lat: 1, lng: 2 } }));
    expect(abortSignal.aborted).toBe(true);
    expect(onLocationSelect).toHaveBeenCalledWith(expect.objectContaining({ source: "map" }));
  });

  it("cancela la búsqueda en curso al arrastrar el marcador y descarta su resultado", async () => {
    vi.useFakeTimers();
    let abortSignal;
    let resolveSearch;
    const fetchMock = vi.fn((url, options) => {
      if (String(url).includes("/search")) {
        abortSignal = options.signal;
        return new Promise((resolve) => (resolveSearch = resolve));
      }
      return Promise.resolve(geocodeResponse(reverseData));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderMap({ latitude: 1, longitude: 2, address: "Av. Rivadavia 100", addressSource: "input" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    await act(async () => mapApi.markerProps.eventHandlers.dragend());
    expect(abortSignal.aborted).toBe(true);
    onLocationSelect.mockClear();
    await act(async () => resolveSearch(geocodeResponse([{ lat: "1", lon: "2", display_name: "x" }])));
    expect(onLocationSelect).not.toHaveBeenCalled();
  });

  it("si no se puede leer el marcador al arrastrar, no hace nada", async () => {
    vi.stubGlobal("fetch", vi.fn());
    mapApi.hideHandle = true;
    renderMap({ latitude: 1, longitude: 2 });
    await act(async () => mapApi.markerProps.eventHandlers.dragend());
    expect(onLocationSelect).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useIndicatorOverview } from "../useIndicatorOverview";
import { AuthContext } from "../../context/authContext";
import { fetchIndicatorOverview, getStoredToken } from "../../services/apiClient";
import { AGENT, authFor } from "../../test/renderWithProviders";
import { indicatorOverview } from "../../test/indicatorFixtures";
vi.mock("../../services/apiClient",()=>({fetchIndicatorOverview:vi.fn(),getStoredToken:vi.fn()}));
let auth;
const wrapper=({children})=><AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{resolve,promise};};
beforeEach(()=>{vi.clearAllMocks();auth=authFor(AGENT);getStoredToken.mockReturnValue("token-a");fetchIndicatorOverview.mockResolvedValue(indicatorOverview());});
it("obtiene métricas reales con filtros sin descargar páginas y refresca",async()=>{
  const {result}=renderHook(()=>useIndicatorOverview({days:30,priority:"HIGH"}),{wrapper});
  expect(result.current.loading).toBe(true);expect(result.current.data).toBeNull();
  await waitFor(()=>expect(result.current.data?.counts.total).toBe(125));
  expect(fetchIndicatorOverview).toHaveBeenCalledWith({days:30,priority:"HIGH"});
  act(()=>result.current.refetch());expect(result.current.data).toBeNull();
  await waitFor(()=>expect(fetchIndicatorOverview).toHaveBeenCalledTimes(2));
});
it("descarta una respuesta tardía al cambiar filtros",async()=>{
  const old=deferred();fetchIndicatorOverview.mockReturnValueOnce(old.promise);
  const {result,rerender}=renderHook(({days})=>useIndicatorOverview({days}),{wrapper,initialProps:{days:7}});
  rerender({days:30});await waitFor(()=>expect(result.current.data?.counts.total).toBe(125));
  await act(async()=>old.resolve(indicatorOverview({counts:{total:999}})));
  expect(result.current.data.counts.total).toBe(125);
});
it("oculta datos de otro usuario/token y no admite su respuesta tardía",async()=>{
  const old=deferred();fetchIndicatorOverview.mockReturnValueOnce(old.promise);
  const {result,rerender}=renderHook(()=>useIndicatorOverview(),{wrapper});
  auth=authFor({...AGENT,id:"another",role:"ADMIN"});getStoredToken.mockReturnValue("token-b");rerender();
  await waitFor(()=>expect(result.current.data?.counts.total).toBe(125));
  await act(async()=>old.resolve(indicatorOverview({counts:{total:999}})));expect(result.current.data.counts.total).toBe(125);
  auth=authFor({role:"CITIZEN"});rerender();expect(result.current.data).toBeNull();expect(result.current.error).toContain("permiso");
});
it.each([[401,"sesión"],[403,"permiso"],[500,"Falla"],[undefined,"Falla"]])("no convierte el error %s en cifras cero",async(status,message)=>{
  fetchIndicatorOverview.mockRejectedValue(Object.assign(new Error("Falla"),{status}));
  const {result}=renderHook(()=>useIndicatorOverview(),{wrapper});
  await waitFor(()=>expect(result.current.loading).toBe(false));expect(result.current.data).toBeNull();expect(result.current.error).toContain(message);
});
it("usa un mensaje comprensible si no hay detalle de red",async()=>{
  fetchIndicatorOverview.mockRejectedValue({});const{result}=renderHook(()=>useIndicatorOverview(),{wrapper});
  await waitFor(()=>expect(result.current.error).toContain("No pudimos"));
});
it.each([null,{role:"AREA_RESPONSIBLE"},{role:"CITIZEN"}])("no consulta sin permisos %j",(user)=>{
  auth=authFor(user);const{result}=renderHook(()=>useIndicatorOverview(),{wrapper});expect(result.current.error).toContain("permiso");expect(fetchIndicatorOverview).not.toHaveBeenCalled();
});

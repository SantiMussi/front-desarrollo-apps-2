export function messageForCatalogError(err) {
  if (err?.status === 401) return "Tu sesión no es válida. Volvé a iniciar sesión.";
  if (err?.status === 403) return "No tenés permiso para administrar el catálogo.";
  if (err?.status === 404) return "No encontramos ese registro. Puede haber sido eliminado.";
  if (err?.status === 409) {
    const code = String(err?.code || "").toUpperCase();
    const message = String(err?.message || "");
    const dependencyConflict = code.includes("DEPEND") || code.includes("ACTIVE_CHILD") || /depend|asociad|hij[oa]|activ[oa]/i.test(message);

    if (dependencyConflict) {
      return message || "No se puede cambiar el estado porque hay registros relacionados activos.";
    }
    return message || "Ya existe un registro con esos datos.";
  }
  if (err?.status === 400) return err?.message || "Revisá los datos ingresados.";
  return err?.message || "No pudimos completar la operación. Intentá de nuevo.";
}

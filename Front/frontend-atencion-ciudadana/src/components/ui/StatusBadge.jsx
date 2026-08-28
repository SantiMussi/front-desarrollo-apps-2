export default function StatusBadge({ status }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Registrado":
        return "bg-orange-100 text-orange-800";
      case "En revisión":
        return "bg-blue-100 text-blue-800";
      case "En Progreso":
        return "bg-blue-100 text-blue-800";
      case "Derivado":
        return "bg-blue-100 text-blue-800";
      case "Pendiente de información":
        return "bg-blue-100 text-blue-800";
        case "Resuelto":
        return "bg-green-100 text-green-800";
      case "Cerrado":
        return "bg-slate-200 text-slate-700";  
      case "Cerrado (Duplicado)":
        return "bg-slate-200 text-slate-700";
      case "Cancelado":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
}

export default function StatusBadge({ status }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Abierto":
        return "bg-slate-200 text-slate-700";
      case "En Progreso":
        return "bg-[#0F2C59] text-white";
      case "Resuelto":
        return "bg-green-100 text-green-800";
      case "Cerrado":
      case "Cerrado (Duplicado)":
        return "bg-slate-300 text-slate-600";
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

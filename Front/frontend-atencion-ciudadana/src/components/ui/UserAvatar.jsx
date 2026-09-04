export default function UserAvatar({ user, size = "md" }) {
  const sizes = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  const name = user?.firstName || user?.nombre || user?.name || "";
  const surname = user?.lastName || user?.apellido || "";
  const initials = `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";
  const avatar = user?.avatar || user?.avatarUrl || user?.picture;
  if (avatar) return <img src={avatar} alt={`Avatar de ${name}`} className={`${sizes} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`${sizes} inline-flex shrink-0 items-center justify-center rounded-full bg-[#0F2C59] font-semibold text-white`}>
      {user?.initials || initials}
    </span>
  );
}
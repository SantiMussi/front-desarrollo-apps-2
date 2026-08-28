export default function UserAvatar({ user, size = "md" }) {
  const sizes = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  if (user?.avatar) return <img src={user.avatar} alt="" className={`${sizes} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`${sizes} inline-flex shrink-0 items-center justify-center rounded-full bg-[#0F2C59] font-semibold text-white`}>
      {user?.initials || "?"}
    </span>
  );
}
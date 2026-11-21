import { useLayoutEffect, useRef } from "react";

export default function ModalDialog({ label, labelledBy, role, overlayClassName, canDismiss = true, onDismiss, children }) {
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (canDismiss) onDismiss();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0"
    >
      <div className={`relative isolate flex h-full items-center justify-center p-4 ${overlayClassName}`}>
        {children}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          disabled={!canDismiss}
          onClick={onDismiss}
          className="absolute inset-0 -z-10 cursor-default"
        />
      </div>
    </dialog>
  );
}

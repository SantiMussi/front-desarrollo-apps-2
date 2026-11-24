import { useLayoutEffect, useRef } from "react";

export default function ModalDialog({
  label, labelledBy, describedBy, role, overlayClassName, initialFocusRef,
  lockScroll = false, canDismiss = true, onDismiss, children,
}) {
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => {
      dialog.close();
      if (lockScroll) document.body.style.overflow = previousOverflow;
    };
  }, [initialFocusRef, lockScroll]);

  const keepTabInDialog = (event) => {
    if (event.key !== "Tab" || event.defaultPrevented) return;
    const controls = [...event.currentTarget.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")]
      .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled")
        && element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible");
    const first = controls[0];
    const last = controls.at(-1);
    if (document.activeElement === (event.shiftKey ? first : last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      onKeyDown={keepTabInDialog}
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

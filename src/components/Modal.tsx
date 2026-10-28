import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the native <dialog> so focus trapping, Escape, backdrop and inertness
 * come from the platform instead of a hand-rolled key handler. Children stay
 * mounted while closed so a checkout sheet can animate out if we ever want it;
 * today close is instant and that is fine.
 */
export function Modal({
  open,
  onClose,
  label,
  sheet = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  sheet?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clicks that land on the dialog element itself are backdrop clicks:
        // the panel inside covers the rest.
        if (event.target === event.currentTarget) onClose();
      }}
      className={
        sheet
          ? "m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
          : "m-auto w-full max-w-3xl bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
      }
    >
      {open ? children : null}
    </dialog>
  );
}

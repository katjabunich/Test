"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uncompleteTask } from "@/lib/actions";
import { useT } from "@/lib/i18n/client";

/** Global toast slot pinned just above the bottom nav. Other components
    dispatch `doit:snack` window events to summon it (string text +
    optional taskId for "Готово ✓ Отменить" undo affordance). The event
    bus lets TaskItem rows fire-and-forget without re-rendering anything
    in their own tree, so the row's collapse animation and the snack's
    lifecycle stay independent. */

type SnackEventDetail = {
  text: string;
  /** When set, an "Отменить" button appears and calls uncompleteTask. */
  taskId?: string;
};

type Snack = {
  /** Stable counter so React re-mounts the bar when a new snack lands
      while one is already showing, retriggering the slide-in animation. */
  key: number;
  text: string;
  taskId?: string;
};

const SHOW_MS = 5000;

export default function Snackbar() {
  const t = useT();
  const router = useRouter();
  const [snack, setSnack] = useState<Snack | null>(null);
  const [isUndoing, startUndo] = useTransition();

  useEffect(() => {
    let counter = 0;
    function handle(e: Event) {
      const detail = (e as CustomEvent<SnackEventDetail>).detail;
      if (!detail?.text) return;
      counter += 1;
      setSnack({ key: counter, text: detail.text, taskId: detail.taskId });
    }
    window.addEventListener("doit:snack", handle);
    return () => window.removeEventListener("doit:snack", handle);
  }, []);

  useEffect(() => {
    if (!snack) return;
    const id = setTimeout(() => setSnack(null), SHOW_MS);
    return () => clearTimeout(id);
  }, [snack]);

  function handleUndo() {
    const id = snack?.taskId;
    if (!id) return;
    startUndo(async () => {
      try {
        await uncompleteTask(id);
        /* Snackbar lives in the root layout, not inside the page tree,
           so Next.js doesn't reliably auto-refresh the current page's
           RSC payload after the action's revalidatePath runs. Force a
           refresh here so the un-completed task reappears in the list
           without the user having to navigate. */
        router.refresh();
      } catch {
        /* server failed — snack still dismisses; user can retry via task list */
      }
      setSnack(null);
    });
  }

  if (!snack) return null;

  return (
    <div
      key={snack.key}
      role="status"
      style={{
        position: "fixed",
        left: 22,
        right: 22,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
        maxWidth: 416,
        margin: "0 auto",
        background: "var(--ink-strong)",
        color: "var(--paper)",
        borderRadius: 12,
        padding: "12px 14px 12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 60,
        boxShadow: "0 12px 32px rgba(31,24,19,0.32)",
        animation: "snack-in 280ms var(--ease-out) both",
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        {snack.text}
      </span>
      {snack.taskId && (
        <button
          type="button"
          onClick={handleUndo}
          disabled={isUndoing}
          className="tap"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--mint)",
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            cursor: isUndoing ? "default" : "pointer",
            opacity: isUndoing ? 0.6 : 1,
            padding: "4px 6px",
          }}
        >
          {t("tasks.undo")}
        </button>
      )}
    </div>
  );
}

/** Convenience helper for call sites — keeps the event-name + payload
    shape in one place. Pass `taskId` to enable the Undo button. */
export function snack(text: string, opts?: { taskId?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SnackEventDetail>("doit:snack", {
      detail: { text, taskId: opts?.taskId },
    }),
  );
}

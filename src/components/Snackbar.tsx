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
        left: 20,
        right: 20,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
        maxWidth: 420,
        margin: "0 auto",
        background: "var(--ink)",
        color: "#FFFFFF",
        borderRadius: 999,
        padding: "13px 16px 13px 22px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 60,
        boxShadow: "var(--shadow-elevated)",
        animation: "snack-in 280ms var(--ease-out) both",
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.01em",
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
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: 999,
            color: "var(--mint)",
            fontSize: 13.5,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            cursor: isUndoing ? "default" : "pointer",
            opacity: isUndoing ? 0.6 : 1,
            padding: "7px 14px",
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

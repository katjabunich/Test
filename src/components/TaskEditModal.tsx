"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Recurrence, Sphere, Task } from "@/lib/data";
import { createTask, deleteTask, updateTask } from "@/lib/actions";
import { Icons, SphereIcon } from "@/components/Icons";
import { fromIsoDate, today as todayIso } from "@/lib/date";
import { feedbackModalOpen } from "@/lib/feedback";
import { useT, useLang } from "@/lib/i18n/client";

const RECURRENCE_KEYS: Record<NonNullable<Recurrence>, string> = {
  daily: "task.repeat_daily",
  weekly: "task.repeat_weekly",
  biweekly: "task.repeat_biweekly",
  monthly: "task.repeat_monthly",
};

type Props = {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  spheres: Sphere[];
  defaultSphereId?: string | null;
};

export default function TaskEditModal({
  open,
  onClose,
  task,
  spheres,
  defaultSphereId,
}: Props) {
  const t = useT();
  const lang = useLang();
  const isEdit = !!task;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [sphereId, setSphereId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [doToday, setDoToday] = useState(false);
  const [note, setNote] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>(null);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [remindAtLocal, setRemindAtLocal] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    feedbackModalOpen();
    if (task) {
      setTitle(task.title);
      setSphereId(task.sphere_id);
      setDueDate(task.due_date ?? "");
      setDoToday(task.do_today);
      setNote(task.note ?? "");
      setRecurrence(task.recurrence);
      setNoteOpen(!!task.note);
      setRemindAtLocal(task.remind_at ? isoToLocalInput(task.remind_at) : "");
    } else {
      setTitle("");
      setSphereId(defaultSphereId ?? null);
      setDueDate("");
      setDoToday(false);
      setNote("");
      setRecurrence(null);
      setNoteOpen(false);
      setRemindAtLocal("");
    }
    setRecurrenceOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, task, defaultSphereId]);

  if (!open) return null;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        const payload = {
          title: trimmed,
          sphere_id: sphereId,
          due_date: dueDate || null,
          do_today: doToday,
          note: note.trim() || null,
          recurrence,
          remind_at: remindAtLocal ? localInputToIso(remindAtLocal) : null,
        };
        if (isEdit && task) await updateTask(task.id, payload);
        else await createTask(payload);
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  function remove() {
    if (!task) return;
    if (!confirm(t("task.delete_confirm"))) return;
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        onClose();
      } catch (e) {
        console.error(e);
      }
    });
  }

  const dateLabel = (() => {
    if (!dueDate) return "—";
    if (dueDate === todayIso()) return t("common.today");
    const d = fromIsoDate(dueDate);
    if (lang === "en") {
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    }
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(45,38,32,0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--paper)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "10px 22px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -10px 40px rgba(45,38,32,0.18)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4.5,
            background: "var(--ink-20)",
            borderRadius: 3,
            margin: "0 auto 16px",
          }}
        />
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginBottom: 14,
            letterSpacing: "-0.005em",
          }}
        >
          {isEdit ? t("task.title_edit") : t("task.title_new")}
        </div>

        {/* Title input with mintDeep underline */}
        <div
          style={{
            borderBottom: "2px solid var(--mint-deep)",
            paddingBottom: 12,
            marginBottom: 18,
          }}
        >
          <textarea
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("task.name_ph")}
            rows={2}
            style={{
              width: "100%",
              fontFamily: "inherit",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.018em",
              lineHeight: 1.2,
              color: "var(--ink)",
              border: "none",
              outline: "none",
              background: "transparent",
              resize: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        {/* Сфера */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-60)",
            marginBottom: 10,
            letterSpacing: "-0.005em",
          }}
        >
          {t("task.sphere_label")}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 18,
          }}
        >
          <SphereChipButton
            active={sphereId === null}
            label={t("task.sphere_none")}
            onClick={() => setSphereId(null)}
          />
          {spheres.map((s) => (
            <SphereChipButton
              key={s.id}
              active={sphereId === s.id}
              label={s.name}
              color={s.color}
              onClick={() => setSphereId(s.id)}
            />
          ))}
        </div>

        {/* Rows */}
        <Row Icon={Icons.Calendar} label={t("task.date_label")}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="tnum"
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: dueDate === todayIso() ? "var(--mint-deep)" : "var(--ink-80)",
              background: "transparent",
              border: "none",
              outline: "none",
              textAlign: "right",
              padding: 0,
              letterSpacing: "-0.005em",
            }}
          />
          {!dueDate && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-40)",
                letterSpacing: "-0.005em",
              }}
            >
              {dateLabel}
            </span>
          )}
        </Row>

        <Row Icon={Icons.Sun} label={t("task.do_today")}>
          <Toggle on={doToday} onChange={setDoToday} />
        </Row>

        <Row
          Icon={Icons.Repeat}
          label={t("task.repeat_label")}
          onClick={() => setRecurrenceOpen((v) => !v)}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: recurrence ? "var(--ink-80)" : "var(--ink-40)",
              letterSpacing: "-0.005em",
            }}
          >
            {recurrence ? t(RECURRENCE_KEYS[recurrence]) : t("task.repeat_none")}
          </span>
        </Row>
        {recurrenceOpen && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "4px 0 12px",
            }}
          >
            {([null, "daily", "weekly", "biweekly", "monthly"] as Recurrence[]).map(
              (r) => (
                <SphereChipButton
                  key={r ?? "none"}
                  active={recurrence === r}
                  label={r ? t(RECURRENCE_KEYS[r]) : t("task.repeat_none")}
                  onClick={() => {
                    setRecurrence(r);
                    setRecurrenceOpen(false);
                  }}
                />
              ),
            )}
          </div>
        )}

        <Row Icon={Icons.Bell} label={t("task.remind_label")}>
          <input
            type="datetime-local"
            value={remindAtLocal}
            onChange={(e) => setRemindAtLocal(e.target.value)}
            className="tnum"
            style={{
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: remindAtLocal ? "var(--ink-80)" : "var(--ink-40)",
              background: "transparent",
              border: "none",
              outline: "none",
              textAlign: "right",
              padding: 0,
              letterSpacing: "-0.005em",
            }}
          />
          {remindAtLocal && (
            <button
              type="button"
              onClick={() => setRemindAtLocal("")}
              aria-label={t("task.remind_clear")}
              className="tap"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-40)",
                fontSize: 16,
                lineHeight: 1,
                padding: "0 0 0 4px",
              }}
            >
              ×
            </button>
          )}
        </Row>

        <Row
          Icon={Icons.Note}
          label={t("task.note_label")}
          onClick={() => setNoteOpen((v) => !v)}
          last={!noteOpen}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: note ? "var(--ink-80)" : "var(--ink-40)",
              letterSpacing: "-0.005em",
            }}
          >
            {note ? `${note.slice(0, 14)}${note.length > 14 ? "…" : ""}` : `${t("common.add").toLowerCase()}…`}
          </span>
        </Row>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("task.note_ph")}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: 14,
              border: "1px solid var(--ink-10)",
              borderRadius: 12,
              background: "var(--paper-warm)",
              outline: "none",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 70,
              marginTop: 2,
            }}
          />
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            alignItems: "stretch",
          }}
        >
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="tap"
              style={{
                padding: "13px 14px",
                borderRadius: 14,
                border: "1px solid var(--ink-10)",
                background: "transparent",
                color: "var(--alert)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icons.Trash size={15} stroke="var(--alert)" strokeWidth={1.8} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !title.trim()}
            className="tap"
            style={{
              flex: 1,
              padding: "15px 0",
              borderRadius: 14,
              background: title.trim()
                ? "var(--ink-strong)"
                : "var(--ink-20)",
              color: "var(--paper)",
              border: "none",
              cursor: title.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: title.trim()
                ? "0 6px 16px rgba(31,24,19,0.28)"
                : "none",
            }}
          >
            {t("common.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  Icon,
  label,
  children,
  onClick,
  last,
}: {
  Icon: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--ink-05)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Icon size={17} stroke="var(--ink-60)" strokeWidth={1.8} />
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SphereChipButton({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "7px 12px",
        borderRadius: 10,
        background: active && color ? color : "var(--paper-warm)",
        border: `1px solid ${active && color ? color : "var(--ink-05)"}`,
        color: "var(--ink)",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        letterSpacing: "-0.005em",
      }}
    >
      {color && (
        <SphereIcon
          name={label}
          size={11}
          stroke="var(--ink)"
          strokeWidth={2.2}
        />
      )}
      {label}
    </button>
  );
}

/* `<input type="datetime-local">` works in local time. We store ISO/UTC,
   so convert at the boundary. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      style={{
        width: 40,
        height: 24,
        borderRadius: 12,
        background: on ? "var(--mint-deep)" : "var(--ink-20)",
        position: "relative",
        border: "none",
        cursor: "pointer",
        transition: "background 200ms var(--ease-out)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: on ? 18 : 2,
          top: 2,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 220ms var(--ease-spring)",
        }}
      />
    </button>
  );
}

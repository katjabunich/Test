"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Recurrence, Sphere, Task } from "@/lib/data";
import { createTask, deleteTask, updateTask } from "@/lib/actions";
import { Icons, SphereIcon } from "@/components/Icons";
import DatePicker from "@/components/DatePicker";
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
  /** Pre-populate the due-date field when creating a new task.
      Used when the user already pinned a day via the /tasks week-strip
      filter — the new-task modal should inherit that date instead of
      asking the user to re-pick it. */
  defaultDueDate?: string | null;
};

export default function TaskEditModal({
  open,
  onClose,
  task,
  spheres,
  defaultSphereId,
  defaultDueDate,
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [remindAtLocal, setRemindAtLocal] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
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
      setDueDate(defaultDueDate ?? "");
      setDoToday(false);
      setNote("");
      setRecurrence(null);
      setNoteOpen(false);
      setRemindAtLocal("");
    }
    setRecurrenceOpen(false);
    setSaveError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, task, defaultSphereId, defaultDueDate]);

  if (!open) return null;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaveError(null);
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
        // Surface failures in-modal so the user knows the tap registered.
        // Silent close after a server error is what made the Save button
        // look broken on Android Chrome — easy to miss without UI.
        const m = e instanceof Error ? e.message : String(e);
        console.error(e);
        setSaveError(m || t("task.save_failed"));
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
    /* Day-month order in both locales — Russian uses DD.MM and the app's
       English flavour follows the European DD/MM convention to keep the
       two displays parallel. */
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return lang === "en" ? `${dd}/${mm}` : `${dd}.${mm}`;
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
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          padding: "10px 20px calc(22px + env(safe-area-inset-bottom))",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.cancel")}
          className="tap"
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "6px 0 14px",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "block",
              width: 40,
              height: 4.5,
              background: "var(--ink-20)",
              borderRadius: 3,
              margin: "0 auto",
            }}
          />
        </button>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 21,
            fontWeight: 800,
            color: "var(--ink-strong)",
            marginBottom: 14,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          {isEdit ? t("task.title_edit") : t("task.title_new")}
        </div>

        {/* Title input with terra underline */}
        <div
          style={{
            borderBottom: "2px solid var(--terra)",
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
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ink-40)",
            marginBottom: 10,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
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
              emoji={s.emoji}
              onClick={() => setSphereId(s.id)}
            />
          ))}
        </div>

        {/* Rows */}
        <Row
          Icon={Icons.Calendar}
          label={t("task.date_label")}
          onClick={() => setDatePickerOpen(true)}
        >
          <span
            className="tnum"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: !dueDate
                ? "var(--ink-40)"
                : dueDate === todayIso()
                ? "var(--terra)"
                : "var(--ink-80)",
              letterSpacing: "-0.005em",
            }}
          >
            {dueDate ? dateLabel : t("task.date_none")}
          </span>
          {dueDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDueDate("");
              }}
              aria-label={t("task.date_none")}
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
              border: "1.5px solid var(--ink-10)",
              borderRadius: "var(--radius-md)",
              background: "var(--paper-warm)",
              outline: "none",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 70,
              marginTop: 2,
            }}
          />
        )}

        {saveError && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(232,205,154,0.45)",
              color: "var(--ink)",
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
            }}
          >
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: saveError ? 12 : 18,
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
                padding: "13px 16px",
                borderRadius: 999,
                border: "1.5px solid var(--ink-10)",
                background: "#FFFFFF",
                color: "var(--alert)",
                fontSize: 14,
                fontWeight: 700,
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
              borderRadius: 999,
              background: title.trim()
                ? "var(--terra)"
                : "var(--ink-20)",
              color: "#FFFFFF",
              border: "none",
              cursor: title.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              boxShadow: title.trim()
                ? "0 6px 16px rgba(184,92,58,0.35)"
                : "none",
            }}
          >
            {t("common.done")}
          </button>
        </div>
      </div>

      <DatePicker
        open={datePickerOpen}
        value={dueDate || null}
        onClose={() => setDatePickerOpen(false)}
        onChange={(v) => setDueDate(v ?? "")}
      />
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
          fontWeight: 600,
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
  emoji,
  onClick,
}: {
  active: boolean;
  label: string;
  color?: string;
  emoji?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap"
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: active
          ? color
            ? `color-mix(in srgb, #FFFFFF 75%, ${color})`
            : "rgba(196,103,63,0.12)"
          : "#FFFFFF",
        border: `1.5px solid ${
          active
            ? color
              ? `color-mix(in srgb, #FFFFFF 75%, ${color})`
              : "rgba(196,103,63,0.35)"
            : "var(--ink-10)"
        }`,
        color: "var(--ink-strong)",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        letterSpacing: "-0.01em",
      }}
    >
      {color && (
        <SphereIcon
          name={label}
          emoji={emoji}
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
        background: on ? "var(--terra)" : "var(--ink-20)",
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

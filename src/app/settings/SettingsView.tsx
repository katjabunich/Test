"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Sphere } from "@/lib/data";
import SphereEditModal from "@/components/SphereEditModal";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import TimePicker from "@/components/TimePicker";
import { Icons, SphereIcon } from "@/components/Icons";
import { isSoundEnabled, isHapticEnabled, setSoundEnabled, setHapticEnabled } from "@/lib/feedback";
import { isPushSupported, isPushEnabled, enablePush, disablePush, sendTestPush } from "@/lib/push";
import { setDigestTime } from "@/lib/profile";
import { reorderSpheres } from "@/lib/actions";
import { useT, useLang, useSetLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n/dict";
import { Card, ScreenBackdrop, ScreenHeader, SectionLabel } from "@/components/ui";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function utcToLocalHHMM(utc: string | null): string {
  if (!utc) return "";
  const m = /^(\d{2}):(\d{2})/.exec(utc);
  if (!m) return "";
  const h = Number(m[1]);
  const mm = Number(m[2]);
  const off = new Date().getTimezoneOffset();
  const total = ((h * 60 + mm - off) % 1440 + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const m2 = String(total % 60).padStart(2, "0");
  return `${hh}:${m2}`;
}

export default function SettingsView({
  spheres,
  userEmail,
  digestAtUtc,
}: {
  spheres: Sphere[];
  userEmail: string | null;
  digestAtUtc: string | null;
}) {
  const t = useT();
  const lang = useLang();
  const { setLang } = useSetLang();
  const search = useSearchParams();
  /* Honour `?from=<encoded-path>` so the close button drops the user
     back on the page that opened Settings. Validate to a local path
     so a crafted query can't redirect off-site. */
  const rawFrom = search.get("from");
  const closeHref = (() => {
    if (!rawFrom) return "/";
    try {
      const decoded = decodeURIComponent(rawFrom);
      if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
    } catch { /* fall through */ }
    return "/";
  })();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [digestLocal, setDigestLocal] = useState<string>(() => utcToLocalHHMM(digestAtUtc));
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestPickerOpen, setDigestPickerOpen] = useState(false);

  /* Drag-to-reorder state — keep an optimistic local order so the row
     snaps into place immediately while the server action persists. */
  const [order, setOrder] = useState<string[]>(() => spheres.map((s) => s.id));
  useEffect(() => {
    setOrder(spheres.map((s) => s.id));
  }, [spheres]);
  const [, startReorder] = useTransition();

  const orderedSpheres = useMemo(() => {
    const byId = new Map(spheres.map((s) => [s.id, s]));
    const out: Sphere[] = [];
    for (const id of order) {
      const s = byId.get(id);
      if (s) out.push(s);
    }
    /* Defensive: any sphere not in `order` (e.g. a fresh server fetch
       added a row mid-session) goes to the tail in its server order. */
    for (const s of spheres) if (!order.includes(s.id)) out.push(s);
    return out;
  }, [order, spheres]);

  /* Pointer sensor uses distance threshold so quick-tap never starts a
     drag on desktop. Touch sensor uses a 250ms long-press to feel native. */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startReorder(async () => {
      try {
        await reorderSpheres(next);
      } catch (e) {
        console.error("reorderSpheres:", e);
        setOrder(spheres.map((s) => s.id));
      }
    });
  }

  useEffect(() => {
    setSound(isSoundEnabled());
    setHaptic(isHapticEnabled());
    const supported = isPushSupported();
    setPushSupported(supported);
    if (supported) {
      void isPushEnabled().then(setPushOn);
    }
  }, []);

  async function togglePush() {
    setPushBusy(true);
    setPushMsg(null);
    if (pushOn) {
      const r = await disablePush();
      if (r.ok) setPushOn(false);
    } else {
      const r = await enablePush();
      if (r.ok) {
        setPushOn(true);
      } else {
        const baseMsg = t(`settings.push_err_${r.reason}`);
        setPushMsg(r.raw ? `${baseMsg}\n${r.raw}` : baseMsg);
      }
    }
    setPushBusy(false);
  }

  async function persistDigest(value: string) {
    setDigestBusy(true);
    try {
      await setDigestTime(value || null, new Date().getTimezoneOffset());
    } catch (e) {
      console.error("setDigestTime:", e);
    } finally {
      setDigestBusy(false);
    }
  }

  async function sendTest() {
    setPushBusy(true);
    setPushMsg(null);
    const r = await sendTestPush();
    if (r.ok) {
      setPushMsg(t("settings.push_test_sent"));
    } else {
      const baseMsg = t("settings.push_test_failed");
      setPushMsg(r.raw ? `${baseMsg}\n${r.raw}` : baseMsg);
    }
    setPushBusy(false);
  }

  return (
    <>
      {/* isolation: isolate — required stacking context for the z-index -1
         backdrop (see CLAUDE.md trap note / ScreenBackdrop docs). */}
      <div style={{ position: "relative", isolation: "isolate" }}>
      {/* The quietest sky of the four — a barely-there warm wash from the
         physical top edge, melting into the cream ground with no seam. */}
      <ScreenBackdrop gradient="linear-gradient(180deg, #F3EADF 0%, #FBF7F1 62%)" />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          paddingRight: 20,
        }}
      >
        <ScreenHeader
          label={t("settings.sub")}
          style={{ flex: 1, minWidth: 0, padding: "8px 0 18px 20px" }}
        >
          {t("settings.title")}
        </ScreenHeader>
        <Link
          href={closeHref}
          aria-label="Закрыть настройки"
          className="tap"
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "#FFFFFF",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-60)",
            flexShrink: 0,
            marginTop: 8,
            textDecoration: "none",
          }}
        >
          <Icons.Close size={18} stroke="currentColor" strokeWidth={2} />
        </Link>
      </div>

      <div style={{ padding: "0 20px" }}>
        <SectionLabel style={{ padding: "0 4px", marginBottom: 12 }}>
          {t("settings.h_spheres")}
        </SectionLabel>

        {orderedSpheres.length === 0 ? (
          <Card
            style={{
              marginBottom: 12,
              padding: "28px 16px 32px",
              textAlign: "center",
              color: "var(--ink-60)",
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            <SpheresEmpty />
            {t("settings.no_spheres")}
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSpheres.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {/* No overflow:hidden here — the dragged row's lift shadow
                  must be able to escape the card bounds. Rows are
                  transparent at rest, so the corners stay clean. */}
              <Card style={{ padding: "4px 0", marginBottom: 12 }}>
                {orderedSpheres.map((s, i) => (
                  <SortableSphereRow
                    key={s.id}
                    sphere={s}
                    isLast={i === orderedSpheres.length - 1}
                    onTap={() => {
                      setEditing(s);
                      setModalOpen(true);
                    }}
                  />
                ))}
              </Card>
            </SortableContext>
          </DndContext>
        )}

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="tap"
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: 999,
            border: "1.5px dashed var(--ink-20)",
            background: "transparent",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink-60)",
            cursor: "pointer",
            marginBottom: 24,
            letterSpacing: "-0.01em",
          }}
        >
          {t("settings.add_sphere")}
        </button>

        <SectionLabel style={{ padding: "0 4px", marginBottom: 12 }}>
          {t("settings.h_account")}
        </SectionLabel>

        <Card
          style={{
            padding: "4px 0",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderBottom: "1px solid var(--ink-05)",
            }}
          >
            <Icons.User size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail ?? "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPwOpen(true)}
            className="tap"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--ink-05)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icons.Lock size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
              }}
            >
              {t("settings.change_pw")}
            </span>
            <Icons.Chevron size={15} stroke="var(--ink-40)" />
          </button>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="tap"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icons.LogOut size={18} stroke="var(--alert)" strokeWidth={1.8} />
              <span
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: "var(--alert)",
                  letterSpacing: "-0.005em",
                }}
              >
                {t("settings.sign_out")}
              </span>
            </button>
          </form>
        </Card>

        <SectionLabel style={{ padding: "0 4px", marginBottom: 12 }}>
          {t("settings.h_app")}
        </SectionLabel>

        <Card style={{ padding: "4px 0", overflow: "hidden" }}>
          <SettingsToggleRow
            Icon={Icons.Volume}
            label={t("settings.sound")}
            checked={sound}
            onChange={(v) => {
              setSound(v);
              setSoundEnabled(v);
            }}
          />
          <SettingsToggleRow
            Icon={Icons.Vibrate}
            label={t("settings.haptic")}
            checked={haptic}
            onChange={(v) => {
              setHaptic(v);
              setHapticEnabled(v);
            }}
          />
          <LanguageRow lang={lang} onChange={setLang} />
          <SettingsToggleRow
            Icon={Icons.Bell}
            label={t("settings.notify")}
            checked={pushOn}
            disabled={!pushSupported || pushBusy}
            onChange={() => void togglePush()}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 16px",
              borderBottom: pushOn ? "1px solid var(--ink-05)" : "none",
              opacity: pushOn ? 1 : 0.55,
            }}
          >
            <Icons.Sun size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
            <span
              style={{
                flex: 1,
                fontSize: 14.5,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
              }}
            >
              {t("settings.digest")}
            </span>
            <button
              type="button"
              onClick={() => {
                if (pushOn && !digestBusy) setDigestPickerOpen(true);
              }}
              disabled={!pushOn || digestBusy}
              className="tap tnum"
              style={{
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                color: digestLocal ? "var(--ink-80)" : "var(--ink-40)",
                background: "transparent",
                border: "none",
                outline: "none",
                textAlign: "right",
                padding: 0,
                letterSpacing: "-0.005em",
                minWidth: 60,
                cursor: pushOn && !digestBusy ? "pointer" : "default",
              }}
            >
              {digestLocal || "—"}
            </button>
            {digestLocal && (
              <button
                type="button"
                onClick={() => {
                  setDigestLocal("");
                  void persistDigest("");
                }}
                disabled={digestBusy}
                aria-label={t("settings.digest_clear")}
                className="tap"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-40)",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "0 0 0 2px",
                }}
              >
                ×
              </button>
            )}
          </div>
          {pushOn && (
            <button
              type="button"
              onClick={() => void sendTest()}
              disabled={pushBusy}
              className="tap"
              style={{
                width: "100%",
                padding: "13px 16px",
                background: "transparent",
                border: "none",
                textAlign: "left",
                fontSize: 13.5,
                fontWeight: 700,
                color: "var(--terra)",
                cursor: pushBusy ? "default" : "pointer",
                opacity: pushBusy ? 0.5 : 1,
                letterSpacing: "-0.005em",
              }}
            >
              {t("settings.push_test")}
            </button>
          )}
        </Card>
        {pushMsg && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              fontSize: 12.5,
              color: "var(--ink-60)",
              letterSpacing: "-0.005em",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {pushMsg}
          </div>
        )}
      </div>
      </div>

      <SphereEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={editing}
      />
      <PasswordChangeModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <TimePicker
        open={digestPickerOpen}
        value={digestLocal}
        onClose={() => setDigestPickerOpen(false)}
        onChange={(v) => {
          setDigestLocal(v);
          void persistDigest(v);
        }}
        title={t("settings.digest")}
      />
    </>
  );
}

/** Single sphere row wired into @dnd-kit/sortable. The list-shape (rounded
    container with hairline dividers) is preserved by toggling the row's
    own bottom-border, and the row carries its own white background while
    it's being dragged so it visibly lifts above its siblings on the white
    Card surface (the elevated shadow does the actual lifting). */
function SortableSphereRow({
  sphere,
  isLast,
  onTap,
}: {
  sphere: Sphere;
  isLast: boolean;
  onTap: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sphere.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: isDragging || isLast ? "none" : "1px solid var(--ink-05)",
    background: isDragging ? "#FFFFFF" : "transparent",
    border: "none",
    cursor: isDragging ? "grabbing" : "pointer",
    textAlign: "left",
    touchAction: "manipulation",
    boxShadow: isDragging ? "var(--shadow-elevated)" : "none",
    borderRadius: isDragging ? "var(--radius-md)" : 0,
    zIndex: isDragging ? 2 : "auto",
    position: "relative",
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onTap}
      className={isDragging ? undefined : "tap"}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-sm)",
          /* Mute the candy DB colour when it paints a surface. */
          background: `color-mix(in srgb, #FFFFFF 75%, ${sphere.color})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <SphereIcon
          name={sphere.name}
          emoji={sphere.emoji}
          size={18}
          stroke="var(--ink)"
          strokeWidth={2}
        />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {sphere.name}
        </span>
      </span>
      <Icons.Chevron size={16} stroke="var(--ink-40)" />
    </button>
  );
}

function SettingsToggleRow({
  Icon,
  label,
  checked,
  onChange,
  disabled,
  last,
}: {
  Icon: (p: { size?: number; stroke?: string; strokeWidth?: number }) => React.JSX.Element;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      /* .press — the row visibly sinks under the finger (globals.css);
         gentler than .tap's scale+fade, right for full-width list rows. */
      className={disabled ? undefined : "press"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        borderBottom: last ? "none" : "1px solid var(--ink-05)",
        background: "transparent",
        border: "none",
        width: "100%",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
      }}
    >
      <Icon size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        style={{
          width: 38,
          height: 22,
          borderRadius: 12,
          background: checked ? "var(--terra)" : "var(--ink-20)",
          position: "relative",
          transition: "background 200ms var(--ease-out)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--paper)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
            transition: "left 200ms var(--ease-out)",
          }}
        />
      </span>
    </button>
  );
}

function LanguageRow({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderBottom: "1px solid var(--ink-05)",
      }}
    >
      <Icons.Globe size={18} stroke="var(--ink-60)" strokeWidth={1.8} />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.005em",
        }}
      >
        {t("settings.language")}
      </span>
      {/* Plump segmented control: pill track on --paper-deep, active
          segment lifts as a white pill. */}
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          background: "var(--paper-deep)",
          borderRadius: 999,
          padding: 3,
          gap: 2,
        }}
      >
        {(["ru", "en"] as const).map((l) => {
          const active = lang === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange(l)}
              className="tap"
              aria-pressed={active}
              style={{
                border: "none",
                background: active ? "#FFFFFF" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-60)",
                fontSize: 12.5,
                fontWeight: 800,
                padding: "7px 13px",
                borderRadius: 999,
                cursor: "pointer",
                letterSpacing: "0.04em",
                boxShadow: active ? "var(--shadow-card)" : "none",
                transition: "background 200ms var(--ease-out), color 200ms var(--ease-out)",
              }}
            >
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpheresEmpty() {
  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      style={{ display: "block", margin: "0 auto 14px" }}
      aria-hidden
    >
      <circle cx="22" cy="24" r="6" fill="var(--peach)" opacity="0.85" />
      <circle cx="46" cy="22" r="6" fill="var(--mint)" opacity="0.85" />
      <circle cx="34" cy="46" r="6" fill="var(--lilac)" opacity="0.85" />
      <path
        d="M 22 24 L 46 22 L 34 46 Z"
        fill="none"
        stroke="var(--ink-20)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

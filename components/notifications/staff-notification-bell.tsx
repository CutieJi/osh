"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchStaffNotifications,
  markAllReadAction,
  markReadAction,
} from "@/lib/actions/notifications";
import type { StaffNotificationItem } from "@/lib/data/staff-notifications";
import { cn } from "@/lib/utils/cn";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height={16}
      width={16}
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height={14}
      width={14}
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GuestbookIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height={14}
      width={14}
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function StaffNotificationBell({
  align = "right",
  direction = "down",
  iconSize = "h-4 w-4",
  bare = false,
  className,
}: {
  align?: "left" | "right";
  direction?: "up" | "down";
  iconSize?: string;
  bare?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (isInitial = false) => {
    try {
      const res = await fetchStaffNotifications();
      if (res.ok && res.data) {
        setIsLoggedIn(true);
        setUnreadCount(res.data.unreadCount);
        setItems(res.data.notifications);
      } else if (isInitial && (typeof window === "undefined" || !(window as any).__FORCE_BELL)) {
        setIsLoggedIn(false);
      }
    } catch {
      if (isInitial && (typeof window === "undefined" || !(window as any).__FORCE_BELL)) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadData(true);

    // Re-check unread count when returning to the tab
    const onFocus = () => void loadData(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  useEffect(() => {
    if (!open) return;

    const updateCoords = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setCoords({ top: 68, left: 12, right: 12 });
      } else {
        const top = direction === "up" ? rect.top - 8 : rect.bottom + 8;
        if (align === "right") {
          const right = Math.max(16, window.innerWidth - rect.right);
          setCoords({ top, right });
        } else {
          // If aligning left, ensure it doesn't overflow right edge of viewport
          const left = Math.min(rect.left, window.innerWidth - 368);
          setCoords({ top, left: Math.max(16, left) });
        }
      }
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 10);

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, direction, align]);

  if (!isLoggedIn) return null;

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setOpen((prev) => !prev);
    if (!open) {
      void loadData(false);
    }
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    await markAllReadAction();
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "group relative inline-flex cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
          !bare && (className ? className : "h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"),
          !bare && open && "bg-zinc-800 text-zinc-200",
          bare && open && "text-zinc-200",
        )}
        title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : "Notifications"}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className={iconSize} />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-600 px-0.5 text-[9px] font-bold text-white shadow-sm ring-1 ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          id="notification-popover"
          style={
            coords
              ? {
                  position: "fixed",
                  top: `${coords.top}px`,
                  ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
                  ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
                }
              : undefined
          }
          className={cn(
            "fixed z-50 rounded-xl border border-zinc-800 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl",
            "w-[calc(100vw-1.5rem)] sm:w-88 max-w-sm",
            !coords && "left-3 right-3 top-[4.25rem]",
            direction === "up" && "translate-y-[-100%]",
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-950/80 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-800/40">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 transition-colors hover:text-indigo-300 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900 py-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.url as any}
                  onClick={() => {
                    if (!item.isRead) void handleMarkRead(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-zinc-900 group cursor-pointer",
                    !item.isRead && "bg-zinc-900/40",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                      item.kind === "comment"
                        ? "border-cyan-800/50 bg-cyan-950/40 text-cyan-400"
                        : "border-indigo-800/50 bg-indigo-950/40 text-indigo-400",
                    )}
                  >
                    {item.kind === "comment" ? <CommentIcon /> : <GuestbookIcon />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "text-xs line-clamp-1 font-medium",
                          item.isRead ? "text-zinc-300" : "text-zinc-100 font-semibold",
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                      {item.body}
                    </p>
                  </div>

                  {!item.isRead && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"
                      title="Unread"
                    />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export const NotificationBell = StaffNotificationBell;

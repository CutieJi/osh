"use client";

import Link from "next/link";
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
  className,
}: {
  align?: "left" | "right";
  direction?: "up" | "down";
  iconSize?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<StaffNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchStaffNotifications();
      if (res.ok && res.data) {
        setIsLoggedIn(true);
        setUnreadCount(res.data.unreadCount);
        setItems(res.data.notifications);
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    // Re-check unread count when returning to the tab
    const onFocus = () => void loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!isLoggedIn) return null;

  const handleToggle = () => {
    if (!open) {
      setLoading(true);
      void loadData().finally(() => setLoading(false));
    }
    setOpen((prev) => !prev);
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
          "relative inline-flex items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
          className ? className : "h-8 w-8 text-zinc-400 hover:text-zinc-200",
          open && "bg-zinc-800 text-zinc-200",
        )}
        title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : "Notifications"}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "fixed inset-x-3 top-[4.25rem] z-50 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl",
            "sm:absolute sm:inset-auto sm:w-88 sm:max-w-sm",
            direction === "up" ? "sm:bottom-full sm:mb-2 sm:top-auto" : "sm:top-full sm:mt-2 sm:bottom-auto",
            align === "right" ? "sm:right-0 sm:left-auto" : "sm:left-0 sm:right-auto",
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
        </div>
      )}
    </div>
  );
}

export const NotificationBell = StaffNotificationBell;

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import {
  fetchUnnoticedNotifications,
  markNoticedAction,
  markReadAction,
} from "@/lib/actions/notifications";
import { notify } from "@/lib/notify";

// Global module-level tracker so multiple component instances or StrictMode remounts
// never toast the same notification ID twice in a browser session.
const toastedIds = new Set<string>();
let activeCheckPromise: Promise<void> | null = null;

/**
 * Automatically alerts superadmin and staff when they open the site if there
 * are unnoticed comments or guestbook messages ("when open then when not already notice").
 */
export function StaffNotificationListener() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function checkNotifications() {
      try {
        const res = await fetchUnnoticedNotifications();
        if (!res.ok || !res.data || res.data.length === 0) return;

        // Filter out any notifications that have already been toasted in this session
        const freshItems = res.data.filter((item) => !toastedIds.has(item.id));
        const ids = res.data.map((item) => item.id);

        // Acknowledge all as noticed so subsequent refreshes/pages won't alert again
        await markNoticedAction(ids);

        if (freshItems.length === 0) return;

        // Track as toasted immediately
        freshItems.forEach((item) => toastedIds.add(item.id));

        const items = freshItems;
        // 1 item: toast directly
        if (items.length === 1) {
          const item = items[0];
          notify(
            <div className="flex flex-col gap-1 pr-1">
              <span className="text-xs font-semibold text-zinc-100 sm:text-sm">
                {item.title}
              </span>
              <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
                {item.body}
              </p>
              <div className="mt-1">
                <Link
                  href={item.url as any}
                  onClick={() => {
                    void markReadAction(item.id);
                  }}
                  className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                >
                  View &rarr;
                </Link>
              </div>
            </div>,
            "info",
            { id: `staff-notif-${item.id}` },
          );
        } else if (items.length === 2) {
          // 2 items: stagger them with 350ms so Sonner stacks them smoothly without overlap
          items.forEach((item, index) => {
            setTimeout(() => {
              notify(
                <div className="flex flex-col gap-1 pr-1">
                  <span className="text-xs font-semibold text-zinc-100 sm:text-sm">
                    {item.title}
                  </span>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
                    {item.body}
                  </p>
                  <div className="mt-1">
                    <Link
                      href={item.url as any}
                      onClick={() => {
                        void markReadAction(item.id);
                      }}
                      className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </div>,
                "info",
                { id: `staff-notif-${item.id}` },
              );
            }, index * 350);
          });
        } else {
          // 3 or more: show latest item and a summary toast to prevent toast flood
          const latest = items[0];
          notify(
            <div className="flex flex-col gap-1 pr-1">
              <span className="text-xs font-semibold text-zinc-100 sm:text-sm">
                {latest.title}
              </span>
              <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
                {latest.body}
              </p>
              <div className="mt-1">
                <Link
                  href={latest.url as any}
                  onClick={() => {
                    void markReadAction(latest.id);
                  }}
                  className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
                >
                  View &rarr;
                </Link>
              </div>
            </div>,
            "info",
            { id: `staff-notif-${latest.id}` },
          );

          setTimeout(() => {
            notify(
              <div className="flex flex-col gap-1 pr-1">
                <span className="text-xs font-semibold text-zinc-100 sm:text-sm">
                  You have {items.length} new notifications
                </span>
                <p className="text-xs text-zinc-400">
                  Check the notification bell to review all updates.
                </p>
              </div>,
              "info",
              { id: "staff-notif-summary" },
            );
          }, 400);
        }
      } catch (err) {
        console.error("Failed to check unnoticed notifications:", err);
      } finally {
        activeCheckPromise = null;
      }
    }

    if (!activeCheckPromise) {
      activeCheckPromise = checkNotifications();
    }
  }, []);

  return null;
}


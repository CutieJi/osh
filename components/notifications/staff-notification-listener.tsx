"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import {
  fetchUnnoticedNotifications,
  markNoticedAction,
  markReadAction,
} from "@/lib/actions/notifications";
import { notify } from "@/lib/notify";

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

        const ids = res.data.map((item) => item.id);
        // Acknowledge as noticed so subsequent refreshes/pages won't alert again
        await markNoticedAction(ids);

        const items = res.data;
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
            );
          }, 400);
        }
      } catch (err) {
        console.error("Failed to check unnoticed notifications:", err);
      }
    }

    void checkNotifications();
  }, []);

  return null;
}

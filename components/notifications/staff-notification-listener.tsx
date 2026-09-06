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

        for (const item of res.data) {
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
        }
      } catch (err) {
        console.error("Failed to check unnoticed notifications:", err);
      }
    }

    void checkNotifications();
  }, []);

  return null;
}

"use server";

import { auth } from "@/auth";
import {
  clearAllStaffNotifications,
  deleteStaffNotification,
  getStaffNotificationSummary,
  getUnnoticedStaffNotifications,
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
  markStaffNotificationsNoticed,
  type StaffNotificationItem,
} from "@/lib/data/staff-notifications";

export type NotificationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function currentAccountId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Returns any notifications that haven't yet been alerted/toasted to the current user.
 */
export async function fetchUnnoticedNotifications(): Promise<
  NotificationResult<StaffNotificationItem[]>
> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  const notifications = await getUnnoticedStaffNotifications(accountId);
  return { ok: true, data: notifications };
}

/**
 * Returns recent notifications and the unread count for the notification bell.
 */
export async function fetchStaffNotifications(): Promise<
  NotificationResult<{ unreadCount: number; notifications: StaffNotificationItem[] }>
> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  const summary = await getStaffNotificationSummary(accountId);
  return { ok: true, data: summary };
}

/** Alias for fetchStaffNotifications for general user notifications */
export const fetchNotifications = fetchStaffNotifications;

/**
 * Acknowledges that the specified notifications have been toasted/seen by the user on page open.
 */
export async function markNoticedAction(
  ids: string[],
): Promise<NotificationResult<void>> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  await markStaffNotificationsNoticed(accountId, ids);
  return { ok: true, data: undefined };
}

/**
 * Marks a single notification as read.
 */
export async function markReadAction(
  id: string,
): Promise<NotificationResult<void>> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  await markStaffNotificationRead(accountId, id);
  return { ok: true, data: undefined };
}

/**
 * Marks all notifications for the current user as read.
 */
export async function markAllReadAction(): Promise<NotificationResult<void>> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  await markAllStaffNotificationsRead(accountId);
  return { ok: true, data: undefined };
}

/**
 * Clears/deletes a single notification for the current user.
 */
export async function clearNotificationAction(
  id: string,
): Promise<NotificationResult<void>> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  await deleteStaffNotification(accountId, id);
  return { ok: true, data: undefined };
}

/**
 * Clears/deletes all notifications for the current user.
 */
export async function clearAllNotificationsAction(): Promise<
  NotificationResult<void>
> {
  const accountId = await currentAccountId();
  if (!accountId) return { ok: false, error: "Not signed in" };

  await clearAllStaffNotifications(accountId);
  return { ok: true, data: undefined };
}


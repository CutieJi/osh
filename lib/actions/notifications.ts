"use server";

import { getStaffUser } from "@/lib/auth/staff";
import {
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

/**
 * Returns any notifications that haven't yet been alerted/toasted to the current staff user.
 */
export async function fetchUnnoticedNotifications(): Promise<
  NotificationResult<StaffNotificationItem[]>
> {
  const staff = await getStaffUser();
  if (!staff) return { ok: false, error: "Not authorized" };

  const notifications = await getUnnoticedStaffNotifications(staff.id);
  return { ok: true, data: notifications };
}

/**
 * Returns recent notifications and the unread count for the notification bell.
 */
export async function fetchStaffNotifications(): Promise<
  NotificationResult<{ unreadCount: number; notifications: StaffNotificationItem[] }>
> {
  const staff = await getStaffUser();
  if (!staff) return { ok: false, error: "Not authorized" };

  const summary = await getStaffNotificationSummary(staff.id);
  return { ok: true, data: summary };
}

/**
 * Acknowledges that the specified notifications have been toasted/seen by the user on page open.
 */
export async function markNoticedAction(
  ids: string[],
): Promise<NotificationResult<void>> {
  const staff = await getStaffUser();
  if (!staff) return { ok: false, error: "Not authorized" };

  await markStaffNotificationsNoticed(staff.id, ids);
  return { ok: true, data: undefined };
}

/**
 * Marks a single notification as read.
 */
export async function markReadAction(
  id: string,
): Promise<NotificationResult<void>> {
  const staff = await getStaffUser();
  if (!staff) return { ok: false, error: "Not authorized" };

  await markStaffNotificationRead(staff.id, id);
  return { ok: true, data: undefined };
}

/**
 * Marks all notifications for the current staff user as read.
 */
export async function markAllReadAction(): Promise<NotificationResult<void>> {
  const staff = await getStaffUser();
  if (!staff) return { ok: false, error: "Not authorized" };

  await markAllStaffNotificationsRead(staff.id);
  return { ok: true, data: undefined };
}

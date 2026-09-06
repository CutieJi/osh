import { and, desc, eq, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { account, staffNotification } from "@/lib/db/app-schema";

export type StaffNotificationKind = "comment" | "guestbook";

export type StaffNotificationItem = {
  id: string;
  kind: StaffNotificationKind;
  title: string;
  body: string;
  url: string;
  isRead: boolean;
  isNoticed: boolean;
  createdAt: string;
};

export type CreateStaffNotificationsInput = {
  kind: StaffNotificationKind;
  title: string;
  body: string;
  url: string;
  /** If provided, this account will not be notified of their own post. */
  actorAccountId?: string;
  /** Additional accounts to exclude (e.g. if they already received a direct reply notification). */
  excludeAccountIds?: string[];
};

export type CreateUserNotificationInput = {
  accountId: string;
  kind: StaffNotificationKind;
  title: string;
  body: string;
  url: string;
};

type DbHandle = any;

/**
 * Creates a notification for a specific user account (e.g. when someone replied to them).
 */
export async function createUserNotification(
  input: CreateUserNotificationInput,
  database: DbHandle = db,
): Promise<string | null> {
  try {
    const [inserted] = await database
      .insert(staffNotification)
      .values({
        accountId: input.accountId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        url: input.url,
        isRead: false,
        isNoticed: false,
      })
      .returning({ id: staffNotification.id });
    return inserted?.id ?? null;
  } catch (error) {
    console.error("Failed to create user notification:", error);
    return null;
  }
}

/**
 * Creates notifications for all active accounts holding the staff or superuser role.
 * Self-notifications are suppressed when `actorAccountId` is specified.
 */
export async function createStaffNotifications(
  input: CreateStaffNotificationsInput,
  database: DbHandle = db,
): Promise<string[]> {
  try {
    const staffAccounts = await database
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.isActive, true),
          or(eq(account.isStaff, true), eq(account.isSuperuser, true)),
        ),
      );

    const excludeSet = new Set<string>([
      ...(input.actorAccountId ? [input.actorAccountId] : []),
      ...(input.excludeAccountIds ?? []),
    ]);

    const recipientIds: string[] = staffAccounts
      .map((row: { id: string }) => row.id)
      .filter((id: string) => !excludeSet.has(id));

    if (recipientIds.length === 0) return [];

    const rowsToInsert = recipientIds.map((accountId: string) => ({
      accountId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      url: input.url,
      isRead: false,
      isNoticed: false,
    }));

    const inserted = await database
      .insert(staffNotification)
      .values(rowsToInsert)
      .returning({ id: staffNotification.id });

    return inserted.map((row: { id: string }) => row.id);
  } catch (error) {
    console.error("Failed to create staff notifications:", error);
    return [];
  }
}

/**
 * Returns unnoticed notifications for an account (used to trigger toasts on open).
 */
export async function getUnnoticedStaffNotifications(
  accountId: string,
  database: DbHandle = db,
): Promise<StaffNotificationItem[]> {
  const rows = await database
    .select({
      id: staffNotification.id,
      kind: staffNotification.kind,
      title: staffNotification.title,
      body: staffNotification.body,
      url: staffNotification.url,
      isRead: staffNotification.isRead,
      isNoticed: staffNotification.isNoticed,
      createdAt: staffNotification.createdAt,
    })
    .from(staffNotification)
    .where(
      and(
        eq(staffNotification.accountId, accountId),
        eq(staffNotification.isNoticed, false),
      ),
    )
    .orderBy(desc(staffNotification.createdAt))
    .limit(10);

  return rows as StaffNotificationItem[];
}

/**
 * Returns recent notifications and unread count for the notification bell.
 */
export async function getStaffNotificationSummary(
  accountId: string,
  limit = 20,
  database: DbHandle = db,
): Promise<{ unreadCount: number; notifications: StaffNotificationItem[] }> {
  const notifications = (await database
    .select({
      id: staffNotification.id,
      kind: staffNotification.kind,
      title: staffNotification.title,
      body: staffNotification.body,
      url: staffNotification.url,
      isRead: staffNotification.isRead,
      isNoticed: staffNotification.isNoticed,
      createdAt: staffNotification.createdAt,
    })
    .from(staffNotification)
    .where(eq(staffNotification.accountId, accountId))
    .orderBy(desc(staffNotification.createdAt))
    .limit(limit)) as StaffNotificationItem[];

  const unreadRows = await database
    .select({ id: staffNotification.id })
    .from(staffNotification)
    .where(
      and(
        eq(staffNotification.accountId, accountId),
        eq(staffNotification.isRead, false),
      ),
    );

  return {
    unreadCount: unreadRows.length,
    notifications,
  };
}

/**
 * Marks given notifications as noticed so the user is not alerted again on subsequent opens.
 */
export async function markStaffNotificationsNoticed(
  accountId: string,
  ids: string[],
  database: DbHandle = db,
): Promise<void> {
  if (ids.length === 0) return;
  await database
    .update(staffNotification)
    .set({ isNoticed: true })
    .where(
      and(
        eq(staffNotification.accountId, accountId),
        inArray(staffNotification.id, ids),
      ),
    );
}

/**
 * Marks a single notification as read (and noticed).
 */
export async function markStaffNotificationRead(
  accountId: string,
  id: string,
  database: DbHandle = db,
): Promise<void> {
  await database
    .update(staffNotification)
    .set({ isRead: true, isNoticed: true })
    .where(
      and(
        eq(staffNotification.accountId, accountId),
        eq(staffNotification.id, id),
      ),
    );
}

/**
 * Marks all notifications for this account as read (and noticed).
 */
export async function markAllStaffNotificationsRead(
  accountId: string,
  database: DbHandle = db,
): Promise<void> {
  await database
    .update(staffNotification)
    .set({ isRead: true, isNoticed: true })
    .where(
      and(
        eq(staffNotification.accountId, accountId),
        eq(staffNotification.isRead, false),
      ),
    );
}

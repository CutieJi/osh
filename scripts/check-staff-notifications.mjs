/**
 * Check staff notifications against the live database inside a transaction.
 *
 *   npx tsx scripts/check-staff-notifications.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { account, staffNotification } = await import("../lib/db/app-schema.ts");
const {
  clearAllStaffNotifications,
  createStaffNotifications,
  createUserNotification,
  deleteStaffNotification,
  getStaffNotificationSummary,
  getUnnoticedStaffNotifications,
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
  markStaffNotificationsNoticed,
} = await import("../lib/data/staff-notifications.ts");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const ROLLBACK = Symbol("rollback");
const stamp = Date.now();
let n = 0;

try {
  await db.transaction(async (tx) => {
    async function make({ isStaff = false, isSuperuser = false, isActive = true }) {
      const username = `zz-staff-${stamp}-${n++}`;
      const [row] = await tx
        .insert(account)
        .values({
          username,
          email: `${username}@example.invalid`,
          firstName: "zz",
          lastName: "test",
          isStaff,
          isSuperuser,
          isActive,
        })
        .returning();
      return row;
    }

    const superuser = await make({ isStaff: true, isSuperuser: true });
    const staff = await make({ isStaff: true, isSuperuser: false });
    const reader = await make({ isStaff: false, isSuperuser: false });

    // 1. Reader posts guestbook message -> superadmin & staff should be notified
    const ids = await createStaffNotifications(
      {
        kind: "guestbook",
        title: "Reader signed the guestbook",
        body: "Hello from a test reader!",
        url: "/guestbook",
        actorAccountId: reader.id,
      },
      tx,
    );

    check("createStaffNotifications returns created ids", ids.length >= 2, `got ${ids.length}`);

    const superuserNotifs = await getUnnoticedStaffNotifications(superuser.id, tx);
    check(
      "superuser receives notification",
      superuserNotifs.some((item) => item.title === "Reader signed the guestbook"),
    );

    const staffNotifs = await getUnnoticedStaffNotifications(staff.id, tx);
    check(
      "staff receives notification",
      staffNotifs.some((item) => item.title === "Reader signed the guestbook"),
    );

    const readerNotifs = await getUnnoticedStaffNotifications(reader.id, tx);
    check("public reader receives no notification", readerNotifs.length === 0);

    // 2. Staff posts comment -> self-notification suppressed for staff, sent to superuser
    await createStaffNotifications(
      {
        kind: "comment",
        title: "Staff commented on a post",
        body: "Here is a comment",
        url: "/blog/test#comments",
        actorAccountId: staff.id,
      },
      tx,
    );

    const staffNotifsAfter = await getUnnoticedStaffNotifications(staff.id, tx);
    check(
      "staff author does not receive self-notification",
      !staffNotifsAfter.some((item) => item.title === "Staff commented on a post"),
    );

    const superuserNotifsAfter = await getUnnoticedStaffNotifications(superuser.id, tx);
    check(
      "superuser receives notification about staff comment",
      superuserNotifsAfter.some((item) => item.title === "Staff commented on a post"),
    );

    // 2b. User reply notification: when someone replies to reader's guestbook message
    await createUserNotification(
      {
        accountId: reader.id,
        kind: "guestbook",
        title: "Alice replied to your guestbook message",
        body: "Thanks for reading!",
        url: "/guestbook",
      },
      tx,
    );

    const readerReplyNotifs = await getUnnoticedStaffNotifications(reader.id, tx);
    check(
      "user receives reply notification when someone replies via guestbook",
      readerReplyNotifs.some((item) => item.title === "Alice replied to your guestbook message"),
    );

    // 3. Mark noticed -> no longer in unnoticed list, but still unread in summary
    const superuserUnnoticed = await getUnnoticedStaffNotifications(superuser.id, tx);
    check("superuser has unnoticed notifications", superuserUnnoticed.length > 0);

    await markStaffNotificationsNoticed(
      superuser.id,
      superuserUnnoticed.map((item) => item.id),
      tx,
    );

    const superuserUnnoticedAfter = await getUnnoticedStaffNotifications(superuser.id, tx);
    check("unnoticed notifications empty after marking noticed", superuserUnnoticedAfter.length === 0);

    const summary = await getStaffNotificationSummary(superuser.id, 20, tx);
    check("notifications remain unread in summary after being noticed", summary.unreadCount > 0);

    // 4. Mark single and all as read
    const first = summary.notifications[0];
    await markStaffNotificationRead(superuser.id, first.id, tx);

    const summaryAfterOne = await getStaffNotificationSummary(superuser.id, 20, tx);
    const updatedFirst = summaryAfterOne.notifications.find((item) => item.id === first.id);
    check("single notification marked as read", updatedFirst?.isRead === true);

    await markAllStaffNotificationsRead(superuser.id, tx);
    const summaryAfterAll = await getStaffNotificationSummary(superuser.id, 20, tx);
    check("all notifications marked as read", summaryAfterAll.unreadCount === 0);

    // 5. Delete single notification and clear all
    const second = summaryAfterAll.notifications[0];
    await deleteStaffNotification(superuser.id, second.id, tx);
    const summaryAfterDeleteOne = await getStaffNotificationSummary(superuser.id, 20, tx);
    check("single notification deleted", !summaryAfterDeleteOne.notifications.some((n) => n.id === second.id));

    await clearAllStaffNotifications(superuser.id, tx);
    const summaryAfterClearAll = await getStaffNotificationSummary(superuser.id, 20, tx);
    check("all notifications cleared", summaryAfterClearAll.notifications.length === 0 && summaryAfterClearAll.unreadCount === 0);

    // Rollback so no test data remains
    throw ROLLBACK;
  });
} catch (error) {
  if (error !== ROLLBACK) {
    console.error("Test error:", error);
    process.exit(1);
  }
} finally {
  await pool.end();
}

const failed = checks.filter((c) => !c.pass).length;
console.log(failed === 0 ? "\nAll staff notification checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);

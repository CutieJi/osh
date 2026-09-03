/**
 * The **plain-text** halves of the five transactional emails.
 *
 * Kept as prose rather than redesigned: there is nothing visual in them to
 * redo, and they are what a client that will not render HTML shows.
 *
 * Their HTML counterparts are **not** here. Those were the old dark templates
 * and have been redesigned in the site's light theme, composed from
 * `lib/email/layout.ts` -- one shell rather than five files that had to be
 * edited in step.
 *
 * Placeholders are `{{ key }}`, filled by `lib/email/render.ts`, which throws
 * on an unmatched one rather than sending the placeholder to the reader.
 */

/** `contact_autoreply.txt` */
export const contactAutoreplyText = `roshingel.netlify.app — Contact Form
════════════════════════════════════════════════════

Hi {{ display_name }},

Thank you for reaching out to Rosh Ingel.
Your message was received and will be reviewed shortly.

YOUR MESSAGE
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

DETAILS
  Name    {{ name_display }}
  Email   {{ sender_email }}

Rosh typically responds within 1–3 business days.
For anything urgent, reply directly to this email.

════════════════════════════════════════════════════
roshingel.netlify.app · Automated notice
`;

/** `contact_notification.txt` */
export const contactNotificationText = `roshingel.netlify.app — New Message
════════════════════════════════════════════════════

New contact form submission.

FROM
  Name    {{ name }}
  Email   {{ sender_email }}

MESSAGE
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

Reply to this email to respond directly to {{ sender_email }}.

════════════════════════════════════════════════════
roshingel.netlify.app · Automated notification
`;

/** `guestbook_autoreply.txt` */
export const guestbookAutoreplyText = `roshingel.netlify.app — Guestbook
════════════════════════════════════════════════════

Hi {{ display_name }},

Your guestbook entry is now live at roshingel.netlify.app.
It's visible to everyone who visits the guestbook.

YOUR ENTRY
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

DETAILS
  Name       {{ name_display }}
  Email      {{ sender_email }}
  Posted     {{ timestamp }}

VIEW GUESTBOOK
  {{ guestbook_url }}

Replying to this email reaches Rosh directly.
If someone answers you on the guestbook, you will hear about it.

════════════════════════════════════════════════════
roshingel.netlify.app · Automated notice
`;

/** `guestbook_notification.txt` */
export const guestbookNotificationText = `roshingel.netlify.app — New Entry
════════════════════════════════════════════════════

New guestbook entry.

FROM
  Name       {{ name }}
  Email      {{ sender_email }}
  Posted     {{ timestamp }}

ENTRY
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

Reply to this email to respond directly to {{ sender_email }}.

OPEN GUESTBOOK
  {{ guestbook_url }}

════════════════════════════════════════════════════
roshingel.netlify.app · Automated notification
`;

/** `guestbook_reply_notification.txt` */
export const guestbookReplyNotificationText = `roshingel.netlify.app — Reply
════════════════════════════════════════════════════

Hi {{ original_name }},

{{ reply_name }} replied to your guestbook entry at roshingel.netlify.app.

YOUR ORIGINAL ENTRY
──────────────────────────────────────────────────────
{{ original_message_text }}
──────────────────────────────────────────────────────

REPLY FROM {{ reply_name }} · {{ timestamp }}
──────────────────────────────────────────────────────
{{ reply_message_text }}
──────────────────────────────────────────────────────

VIEW FULL CONVERSATION
  {{ guestbook_url }}

To answer {{ reply_name }}, reply on the guestbook.
Replying to this email reaches Rosh instead.

════════════════════════════════════════════════════
roshingel.netlify.app · Reply notification
`;

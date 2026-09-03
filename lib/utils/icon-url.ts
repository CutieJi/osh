/**
 * Serve a skill icon from this origin.
 *
 * `about_skill.icon_svg` stores absolute URLs into
 * `https://roshingel.netlify.app/static/svg/icon/…`. Those files are served from
 * `public/static/svg/`, so in production the absolute and relative forms are
 * the same bytes -- but the absolute one makes local development fetch every
 * icon from the live site, which is slow, offline-hostile, and quietly depends
 * on production being up.
 *
 * Only this exact prefix is rewritten, so a skill whose icon genuinely lives
 * elsewhere keeps working.
 */
export function localIconUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?roshingel\.netlify\.app\/static\//, "/static/");
}

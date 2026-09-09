/**
 * Base origin of the LinkEye documentation backend (`linkeye_back`).
 *
 * Single source of truth for both the public portal (`src/lib/docs.ts`) and the
 * admin dashboard (`src/admin/api.ts`). Route paths live at the call sites; this
 * module only supplies the origin they are appended to.
 *
 * Vite inlines `VITE_API_URL` at BUILD time, so the value is chosen by which env
 * file is active, never at runtime:
 *   - `npm run dev`   → `.env`            → http://localhost:4000
 *   - `npm run build` → `.env.production` → https://api.linkeye.support
 *
 * Kept as a single expression so the minifier constant-folds the inlined value
 * and drops the dev fallback: a production bundle ships no localhost string at
 * all. The fallback only ever applies when no env file supplies the variable.
 * Trailing slashes are stripped so `API_BASE_URL + '/api/docs/index'` never
 * doubles up; Vite already trims whitespace around env-file values.
 *
 * Public configuration only. Never read a service-role key, JWT secret or admin
 * password through a VITE_* variable: everything prefixed VITE_ is inlined into
 * the JavaScript bundle and is readable by anyone who loads the page.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

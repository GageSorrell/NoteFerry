/**
 * Re-exports the monorepo-wide flat ESLint config so `eslint .` also works
 * when run from inside this workspace directly (e.g. `npm run lint` here,
 * or an editor rooted at `Website/`). The single source of truth for rules
 * lives at `../Configuration/eslint.config.js` — see that file for the
 * `Website/components/ui/**` carve-out covering shadcn-generated primitives.
 *
 * @file      eslint.config.js
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

export { default } from "../Configuration/eslint.config.js";

/**
 * Environment flags.
 * IS_DEV is true under `npm run dev` (no login, localStorage only)
 * and false in the production build (Google login + shared server data).
 */
export const IS_DEV: boolean = import.meta.env.DEV;

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

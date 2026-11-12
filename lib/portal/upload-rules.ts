/**
 * Wat er geüpload mag worden naar de foto-opslag van de site: één plek, voor
 * /beheer en voor de Band App (zie app/api/beheer/upload en app/api/fotos/upload).
 */

/** Wat een browser mag tonen zonder dat er iets uitgevoerd wordt. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Tien megabyte. Ruim voor een persfoto, krap genoeg om misbruik te beperken. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Alleen adressen uit de eigen Blob-opslag; die host staat als enige in next.config.ts. */
export const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

import type { Locale } from "@/lib/i18n";

import { en } from "./en";
import { nl } from "./nl";
import type { GrungeCopy } from "./types";

export type { GrungeCopy, Tone } from "./types";
export { PAGE_ARTISTS } from "./types";

/** De inhoud van /grunge in deze taal. */
export const getGrunge = (locale: Locale): GrungeCopy => (locale === "en" ? en : nl);

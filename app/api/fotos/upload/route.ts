import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { authorized } from "@/lib/portal/api-token";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/portal/upload-rules";

/**
 * De sleutelafgifte voor een foto uit de Band App.
 *
 * Zoals app/api/beheer/upload: de browser stuurt het bestand rechtstreeks naar
 * de opslag van Vercel en krijgt hier alleen een kortlopende sleutel. Hier komt
 * het verzoek binnen via de Band App (die zelf het bandlid controleert), dus de
 * controle is de gedeelde sleutel in plaats van de inlog van /beheer.
 *
 * Ook hier geen `onUploadCompleted`: de Band App meldt de foto daarna aan via
 * /api/fotos.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "onleesbaar" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_IMAGE_TYPES,
        maximumSizeInBytes: MAX_IMAGE_BYTES,
        // Twee foto's die toevallig "IMG_0001.jpg" heten mogen elkaar niet overschrijven.
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[foto's] upload uit de Band App geweigerd:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "upload mislukt" }, { status: 400 });
  }
}

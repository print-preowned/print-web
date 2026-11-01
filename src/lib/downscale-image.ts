const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Shrink a photo before upload so it goes up quickly on a mobile connection.
 * Re-encodes as WebP, or JPEG where the browser can't encode WebP (Safari hands
 * back a PNG instead). This also turns formats the server won't take (e.g. HEIC
 * on Safari) into one it will. Returns the original if it can't be decoded.
 */
export async function downscaleImage(
  file: File,
  { maxSize = 1600, quality = 0.82 }: { maxSize?: number; quality?: number } = {},
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type in EXTENSION_BY_TYPE && file.size <= 1024 * 1024) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, "image/webp", quality);
  const blob =
    webp?.type === "image/webp" ? webp : await canvasToBlob(canvas, "image/jpeg", quality);
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.${EXTENSION_BY_TYPE[blob.type]}`, { type: blob.type });
}

import { apiFetch, generateUrl } from "@/lib/api";
import type { BaseResponse } from "@/lib/model";

export type BookUploadUrl = {
  upload_url: string;
  url: string;
};

const FILE_TYPE_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/jp2": "jp2",
};

export function fileTypeFromImage(file: File): string {
  const fromMime = FILE_TYPE_BY_MIME[file.type];
  if (fromMime) return fromMime;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext && ["jpg", "png", "jp2"].includes(ext)) return ext;

  throw new Error("Supports JPG, JPEG2000, and PNG only");
}

export function contentTypeForFileType(fileType: string): string {
  switch (fileType) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "jp2":
      return "image/jp2";
    default:
      return `image/${fileType}`;
  }
}

export async function readBookUploadUrl(fileType: string): Promise<BookUploadUrl> {
  return readStagingUploadUrl("/works/upload-url", fileType);
}

async function readStagingUploadUrl(path: string, fileType: string): Promise<BookUploadUrl> {
  const res = await apiFetch<BaseResponse<BookUploadUrl>>(
    generateUrl(path, { file_type: fileType }),
  );
  return res.data;
}

export async function uploadBookCoverToStaging(file: File): Promise<string> {
  return uploadImageToStaging("/works/upload-url", file);
}

/** Upload to a temporary key; the record it's saved on moves it out of staging. */
export async function uploadImageToStaging(uploadUrlPath: string, file: File): Promise<string> {
  const fileType = fileTypeFromImage(file);
  const { upload_url, url } = await readStagingUploadUrl(uploadUrlPath, fileType);

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentTypeForFileType(fileType) },
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => "");
    console.error("S3 upload failed:", uploadRes.status, detail);
    throw new Error("Failed to upload image to storage");
  }

  return url;
}

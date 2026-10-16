import { apiFetch, generateUrl } from "@/lib/api";
import type { BaseResponse } from "@/lib/model";
import { contentTypeForFileType, fileTypeFromImage } from "./book-image";

type ProfileImageUploadUrl = {
  upload_url: string;
  url: string;
};

async function uploadToProfileAsset(file: File, endpoint: string): Promise<string> {
  const fileType = fileTypeFromImage(file);
  const response = await apiFetch<BaseResponse<ProfileImageUploadUrl>>(
    generateUrl(endpoint, { file_type: fileType }),
  );
  const upload = await fetch(response.data.upload_url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentTypeForFileType(fileType),
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
    },
  });

  if (!upload.ok) {
    throw new Error("Failed to upload profile image");
  }

  return response.data.url;
}

export function uploadAuthorPortrait(file: File, authorId: string): Promise<string> {
  return uploadToProfileAsset(
    file,
    `/authors/${encodeURIComponent(authorId)}/portrait-upload-url`,
  );
}

export function uploadUserAvatar(file: File, userId: string): Promise<string> {
  return uploadToProfileAsset(
    file,
    `/users/${encodeURIComponent(userId)}/avatar-upload-url`,
  );
}

export function uploadSellerLogo(file: File, sellerId: string): Promise<string> {
  return uploadToProfileAsset(
    file,
    `/sellers/${encodeURIComponent(sellerId)}/logo-upload-url`,
  );
}
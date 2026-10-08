function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  throw new Error("JWT_SECRET is required");
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}

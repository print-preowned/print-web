function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return "secret";
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}

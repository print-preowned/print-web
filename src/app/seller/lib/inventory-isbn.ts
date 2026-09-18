export const ISBN_PATTERN = /^[0-9Xx-]{10,17}$/;
export const ISBN_ERROR_MESSAGE = "Use a valid ISBN-10 or ISBN-13";

export function isValidIsbn(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 || ISBN_PATTERN.test(trimmed);
}

export function isbnFieldError(value: string) {
  return isValidIsbn(value) || ISBN_ERROR_MESSAGE;
}

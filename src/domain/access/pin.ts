// A PIN is exactly 4 ASCII digits (0-9). \d without the "u" flag still matches non-ASCII
// decimal digits in some engines, so this matches the [0-9] class explicitly instead.
const PIN_PATTERN = /^[0-9]{4}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

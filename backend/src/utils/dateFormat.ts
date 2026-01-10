import { DateTime } from 'luxon';

/**
 * Formats a UTC datetime (from database) into a nice human-readable string
 * in the desired timezone.
 *
 * @param utcDate - Date object or ISO string from DB (assumed UTC)
 * @param targetTimezone - IANA timezone (e.g. "Asia/Kolkata", "America/New_York", "Europe/London")
 * @param options - formatting preferences
 */
export function formatBookingTime(
  utcDate: Date | string,
  targetTimezone: string = 'UTC',
  options: {
    includeWeekday?: boolean;     // default: true
    includeYear?: boolean;        // default: true
    shortMonth?: boolean;         // Jan vs January
    timeOnly?: boolean;           // only time + zone
    dateOnly?: boolean;           // only date
  } = {}
): string {
  // Parse UTC date
  const dt = DateTime.fromJSDate(
    typeof utcDate === 'string' ? new Date(utcDate) : utcDate,
    { zone: 'utc' }
  ).setZone(targetTimezone);

  if (!dt.isValid) {
    return 'Invalid date';
  }

  const {
    includeWeekday = true,
    includeYear = true,
    shortMonth = false,
    timeOnly = false,
    dateOnly = false,
  } = options;

  if (timeOnly) {
    return dt.toFormat("h:mm a '(timezone)'");
    // → 3:30 PM (IST)
  }

  if (dateOnly) {
    return dt.toFormat(
      `${includeWeekday ? 'cccc, ' : ''}${shortMonth ? 'LLL' : 'LLLL'} dd${includeYear ? ', yyyy' : ''}`
    );
    // → Thursday, January 15, 2026
    // or → Jan 15, 2026
  }

  // Default full format
  const formatParts = [
    includeWeekday ? 'cccc' : '',
    shortMonth ? 'LLL' : 'LLLL',
    'dd',
    includeYear ? 'yyyy' : '',
    "'at'",
    'h:mm a',
    'ZZZZ', // timezone abbreviation
  ].filter(Boolean);

  return dt.toFormat(formatParts.join(' '));
}
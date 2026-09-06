/**
 * Nickname takes priority for calendar displays specifically, where space is
 * tight and a long legal name truncates badly. Everywhere else (employee
 * lists, request history, formal record-keeping) keeps showing full_name.
 */
export function displayName(person: { full_name: string; nickname?: string | null }): string {
  return person.nickname?.trim() || person.full_name;
}

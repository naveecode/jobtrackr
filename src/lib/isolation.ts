/**
 * Every database read and write goes through these predicates.
 * Callers must pass the authenticated user id; there is no admin bypass.
 */
export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function requireUserId(userId: string | null | undefined): string {
  if (!userId) throw new AuthError();
  return userId;
}

export function applicationWhere(userId: string, id?: string) {
  requireUserId(userId);
  return id ? { id, userId } : { userId };
}

export function noteWhere(userId: string, noteId: string) {
  requireUserId(userId);
  return { id: noteId, application: { userId } };
}

export function reminderWhere(userId: string, reminderId: string) {
  requireUserId(userId);
  return { id: reminderId, application: { userId } };
}

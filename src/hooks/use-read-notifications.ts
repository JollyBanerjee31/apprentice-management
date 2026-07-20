"use client";

import { useCallback, useEffect, useState } from "react";

// Notifications are derived server-side from live Firestore state (pending
// requests, unsigned payslips, etc.) — there's no notification collection to
// mark "read" in the database. Read/cleared state is tracked client-side in
// localStorage instead, keyed per user so a shared browser doesn't leak one
// person's read state into another's session.
function storageKey(userKey: string) {
  return `notif-read:${userKey}`;
}

function loadReadIds(userKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function useReadNotifications(userKey: string) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setReadIds(loadReadIds(userKey));
  }, [userKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      setReadIds(next);
      try {
        window.localStorage.setItem(storageKey(userKey), JSON.stringify(Array.from(next)));
      } catch {
        // localStorage unavailable (private browsing, quota) — state just won't persist
      }
    },
    [userKey],
  );

  const markRead = useCallback(
    (id: string) => {
      persist(new Set(readIds).add(id));
    },
    [readIds, persist],
  );

  const markAllRead = useCallback(
    (ids: string[]) => {
      const next = new Set(readIds);
      ids.forEach((id) => next.add(id));
      persist(next);
    },
    [readIds, persist],
  );

  return { readIds, markRead, markAllRead };
}

import type { SupabaseClient } from "@automutiny/db";

const documentBucket = "agent-documents";

export async function purgeExpiredVisitorData(client: SupabaseClient, now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1_000).toISOString();
  const sessions = await client
    .from("visitor_sessions")
    .select("id")
    .lt("last_seen_at", cutoff)
    .limit(1_000);
  if (sessions.error)
    throw new Error(`Could not inspect expired visitor sessions: ${sessions.error.message}`);
  const sessionIds = (sessions.data ?? []).map((row) => row.id as string);
  let storageObjects = 0;
  if (sessionIds.length) {
    const documents = await client
      .from("documents")
      .select("storage_path")
      .in("visitor_session_id", sessionIds);
    if (documents.error)
      throw new Error(`Could not inspect expired visitor documents: ${documents.error.message}`);
    const paths = (documents.data ?? [])
      .map((row) => row.storage_path as string | null)
      .filter((path): path is string => Boolean(path));
    if (paths.length) {
      const removed = await client.storage.from(documentBucket).remove(paths);
      if (removed.error)
        throw new Error(`Could not purge expired document storage: ${removed.error.message}`);
      storageObjects = removed.data?.length ?? paths.length;
    }
  }
  const purged = await client.rpc("purge_visitor_sessions");
  if (purged.error)
    throw new Error(`Could not purge expired visitor sessions: ${purged.error.message}`);
  return {
    sessions: typeof purged.data === "number" ? purged.data : sessionIds.length,
    storageObjects,
  };
}

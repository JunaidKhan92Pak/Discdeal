/** Errors that mean "could not reach it" (as opposed to a mistake in a query). Used by the server and the scripts. */
export function isConnectionError(error: unknown): boolean {
  const e = error as { code?: string; name?: string; cause?: { code?: string } };
  const code = e?.code ?? e?.cause?.code ?? "";
  return (
    e?.name === "AbortError" ||
    e?.name === "TimeoutError" ||
    /CONNECT_TIMEOUT|CONNECTION_CLOSED|CONNECTION_ENDED|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR/.test(code)
  );
}

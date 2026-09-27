import { ApiError, RateLimitError } from "@/lib/api/client";

export function ErrorPanel({ error, title }: { error: unknown; title?: string }) {
  const isApi = error instanceof ApiError;

  const heading =
    title ??
    (error instanceof RateLimitError
      ? "Has superado el límite de peticiones"
      : "No se pudo cargar");

  return (
    <div
      role="alert"
      className="card border-rose-500/30 bg-rose-950/25 p-6 text-left sm:p-8"
    >
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/pokeball.svg"
          alt=""
          width={40}
          height={40}
          className="mt-0.5 h-10 w-10 shrink-0 opacity-70"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-rose-200">{heading}</h2>

          {isApi ? (
            <>
              <p className="mt-2 text-sm text-rose-100/80">{error.message}</p>

              {error.errors ? (
                <ul className="mt-3 space-y-1 text-sm text-rose-100/70">
                  {error.messages.map((message) => (
                    <li key={message} className="font-mono text-xs">
                      {message}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-3 font-mono text-xs text-rose-200/50">
                {error.status} · {error.code}
                {error.traceId ? ` · traceId ${error.traceId}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-rose-100/80">
              {error instanceof Error ? error.message : "Error desconocido."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

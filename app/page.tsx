'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { workflowCatalog } from '@/lib/workflow-catalog';
import { CheckCircle2, CircleAlert, LoaderCircle, Play, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

type LaunchResult = {
  id: string;
  name: string;
  ok: boolean;
  status?: number;
  error?: string;
};

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLaunching, setIsLaunching] = useState(false);
  const [results, setResults] = useState<LaunchResult[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  const workflowCount: number = workflowCatalog.length;
  const selectedCount = selected.size;
  const selectedNames = useMemo(
    () =>
      workflowCatalog
        .filter((workflow) => selected.has(workflow.id))
        .map((workflow) => workflow.name),
    [selected],
  );

  function toggleWorkflow(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setResults([]);
    setRequestError(null);
  }

  async function launchSelected() {
    if (selectedCount === 0 || isLaunching) return;

    setIsLaunching(true);
    setResults([]);
    setRequestError(null);

    try {
      const response = await fetch('/api/workflows/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowIds: [...selected] }),
      });

      const payload = (await response.json()) as {
        results?: LaunchResult[];
        error?: string;
      };

      if (!response.ok && !payload.results) {
        throw new Error(payload.error ?? 'No se pudo completar la solicitud.');
      }

      setResults(payload.results ?? []);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setIsLaunching(false);
    }
  }

  const successfulRuns = results.filter((result) => result.ok).length;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto flex w-full max-w-[720px] flex-col gap-8">
        <header className="flex items-center justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Sparkles aria-hidden="true" className="size-4" />
              WorkflowStarter
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Lanzar workflows
            </h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-medium text-slate-400">
            {workflowCount} {workflowCount === 1 ? 'workflow' : 'workflows'}
          </span>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-sm text-slate-400">
              Selecciona uno o más procesos para iniciarlos.
            </p>
          </div>

          <div aria-label="Lista de workflows" className="divide-y divide-white/[0.07]">
            {workflowCatalog.map((workflow) => {
              const isSelected = selected.has(workflow.id);
              const result = results.find((item) => item.id === workflow.id);

              return (
                <label
                  key={workflow.id}
                  className="group flex min-h-20 cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.035] sm:px-6"
                >
                  <Checkbox
                    aria-label={`Seleccionar ${workflow.name}`}
                    checked={isSelected}
                    disabled={isLaunching}
                    onCheckedChange={(checked) =>
                      toggleWorkflow(workflow.id, checked === true)
                    }
                    className="size-5 rounded-md border-slate-600 bg-slate-900 data-checked:border-cyan-400 data-checked:bg-cyan-400 data-checked:text-slate-950"
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-300">
                      <Sparkles aria-hidden="true" className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-slate-100">
                        {workflow.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        Webhook GET
                      </span>
                    </span>
                  </span>

                  {result ? (
                    <span
                      className={`flex items-center gap-1.5 text-sm font-medium ${
                        result.ok ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.ok ? (
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                      ) : (
                        <CircleAlert aria-hidden="true" className="size-4" />
                      )}
                      {result.ok ? 'Lanzado' : 'Error'}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          <footer className="border-t border-white/10 bg-white/[0.018] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="min-h-5 text-sm text-slate-400">
                {isLaunching
                  ? `Lanzando ${selectedNames.join(', ')}…`
                  : selectedCount > 0
                    ? `${selectedCount} ${selectedCount === 1 ? 'seleccionado' : 'seleccionados'}`
                    : 'Ningún workflow seleccionado'}
              </p>
              <Button
                onClick={launchSelected}
                disabled={selectedCount === 0 || isLaunching}
                size="lg"
                className="h-11 min-w-36 rounded-xl bg-cyan-300 px-5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 hover:bg-cyan-200 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isLaunching ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Play aria-hidden="true" className="fill-current" />
                )}
                {isLaunching ? 'Lanzando' : 'Lanzar'}
              </Button>
            </div>

            {requestError ? (
              <div
                role="alert"
                className="mt-4 flex gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-300"
              >
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {requestError}
              </div>
            ) : null}

            {results.length > 0 ? (
              <div
                aria-live="polite"
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  successfulRuns === results.length
                    ? 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300'
                    : 'border-amber-400/20 bg-amber-400/[0.07] text-amber-200'
                }`}
              >
                {successfulRuns === results.length
                  ? `${successfulRuns} ${successfulRuns === 1 ? 'workflow lanzado' : 'workflows lanzados'} correctamente.`
                  : `${successfulRuns} de ${results.length} workflows se lanzaron correctamente.`}
                {results.some((result) => !result.ok) ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                    {results
                      .filter((result) => !result.ok)
                      .map((result) => (
                        <li key={result.id}>
                          {result.name}: {result.error ?? `HTTP ${result.status}`}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </footer>
        </div>

        <p className="text-center text-xs text-slate-600">
          Las credenciales y las URLs se procesan únicamente en el servidor.
        </p>
      </section>
    </main>
  );
}

import { getWorkflowRuntime } from '@/lib/workflows.server';

export const dynamic = 'force-dynamic';

const MAX_WORKFLOWS_PER_REQUEST = 20;
const WEBHOOK_TIMEOUT_MS = 30_000;

type LaunchResult = {
  id: string;
  name: string;
  ok: boolean;
  status?: number;
  error?: string;
};

function encodeBasicAuth(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function launchWorkflow(id: string): Promise<LaunchResult> {
  let workflow;

  try {
    workflow = getWorkflowRuntime(id);
  } catch (error) {
    return {
      id,
      name: id,
      ok: false,
      error: error instanceof Error ? error.message : 'Configuración incompleta.',
    };
  }

  if (!workflow) {
    return { id, name: id, ok: false, error: 'Workflow desconocido.' };
  }

  try {
    const response = await fetch(workflow.url, {
      method: workflow.method,
      headers: {
        Authorization: `Basic ${encodeBasicAuth(workflow.username, workflow.password)}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        id: workflow.id,
        name: workflow.name,
        ok: false,
        status: response.status,
        error: `El webhook respondió HTTP ${response.status}.`,
      };
    }

    return {
      id: workflow.id,
      name: workflow.name,
      ok: true,
      status: response.status,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      id: workflow.id,
      name: workflow.name,
      ok: false,
      error: timedOut
        ? 'El webhook superó el tiempo límite de 30 segundos.'
        : 'No se pudo contactar el webhook.',
    };
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return Response.json(
      { error: 'El contenido debe enviarse como JSON.' },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'JSON no válido.' }, { status: 400 });
  }

  const workflowIds =
    typeof body === 'object' && body !== null && 'workflowIds' in body
      ? (body as { workflowIds?: unknown }).workflowIds
      : null;

  if (
    !Array.isArray(workflowIds) ||
    workflowIds.length === 0 ||
    workflowIds.length > MAX_WORKFLOWS_PER_REQUEST ||
    workflowIds.some((id) => typeof id !== 'string')
  ) {
    return Response.json(
      { error: 'Selecciona entre 1 y 20 workflows válidos.' },
      { status: 400 },
    );
  }

  const uniqueIds = [...new Set(workflowIds)];
  const results = await Promise.all(uniqueIds.map(launchWorkflow));
  const allSucceeded = results.every((result) => result.ok);

  return Response.json(
    { results },
    { status: allSucceeded ? 200 : 502 },
  );
}

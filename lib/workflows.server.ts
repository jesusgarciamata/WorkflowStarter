import { workflowCatalog, type WorkflowId } from '@/lib/workflow-catalog';

export type WorkflowRuntime = {
  id: WorkflowId;
  name: string;
  url: string;
  method: 'GET';
  username: string;
  password: string;
};

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
}

export function getWorkflowRuntime(id: string): WorkflowRuntime | null {
  const workflow = workflowCatalog.find((item) => item.id === id);
  if (!workflow) return null;

  return {
    id: workflow.id,
    name: workflow.name,
    method: workflow.method,
    url: requiredEnvironmentValue(`${workflow.envPrefix}_WEBHOOK_URL`),
    username: requiredEnvironmentValue('WEBHOOK_USERNAME'),
    password: requiredEnvironmentValue('WEBHOOK_PASSWORD'),
  };
}

export const workflowCatalog = [
  {
    id: 'astral-sketch',
    name: 'AstralSketch',
    envPrefix: 'ASTRALSKETCH',
    method: 'GET',
  },
  {
    id: 'astral-german',
    name: 'Astral GERMAN',
    envPrefix: 'ASTRAL_GERMAN',
    method: 'GET',
  },
  {
    id: 'somos-cosmos',
    name: 'Somos Cosmos',
    envPrefix: 'SOMOS_COSMOS',
    method: 'GET',
  },
  {
    id: 'sketch-dinero',
    name: 'Sketch Dinero',
    envPrefix: 'SKETCH_DINERO',
    method: 'GET',
  },
] as const;

export type WorkflowId = (typeof workflowCatalog)[number]['id'];

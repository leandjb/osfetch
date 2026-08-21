import { registry } from '../modules/index.js';

export async function assemble(backend) {
  const results = await Promise.all(
    registry.map(async ({ probe }) => {
      try {
        const res = await probe(backend);
        return res;
      } catch {
        return null;
      }
    })
  );
  // Drop nulls, keep order
  return results.filter((r) => r != null);
}

export default assemble;

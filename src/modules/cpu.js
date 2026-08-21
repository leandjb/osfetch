export async function getCPU(backend) {
  try {
    let cpus;
    try {
      cpus = backend.os.cpus();
    } catch {
      return null;
    }
    if (!Array.isArray(cpus) || cpus.length === 0) return null;
    const model = cpus[0]?.model?.trim();
    const count = cpus.length;
    if (!model) {
      return { label: 'CPU', value: `${count} cores` };
    }
    return { label: 'CPU', value: `${model} (${count})` };
  } catch {
    return null;
  }
}

export default getCPU;

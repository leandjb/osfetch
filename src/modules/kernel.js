export async function getKernel(backend) {
  try {
    let value = null;
    try {
      value = backend.os.release();
    } catch {}
    if (!value) {
      try {
        value = backend.os.version();
      } catch {}
    }
    if (!value || typeof value !== 'string' || !value.trim()) return null;
    return { label: 'Kernel', value: value.trim() };
  } catch {
    return null;
  }
}

export default getKernel;

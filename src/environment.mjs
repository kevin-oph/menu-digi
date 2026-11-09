// La compilación pública es una demostración estática, sin API ni pagos.
export const publicDemo = import.meta.env?.VITE_PUBLIC_DEMO === 'true';
export const assetUrl = path => `${import.meta.env?.BASE_URL || '/'}${path.replace(/^\//,'')}`;

/** Mensagem legível de um erro desconhecido, com fallback quando não há texto útil. */
export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Reutiliza sucesso; após rejeição, a próxima tentativa manual recebe outra URL de módulo. */
export function createModuleLoader<T>(
  initial: () => Promise<T>,
  url: string,
  importModule: (url: string) => Promise<T>,
): () => Promise<T> {
  let attempt = 0;
  let request: Promise<T> | undefined;
  return () => {
    if (!request) {
      const current = attempt++;
      request = (current === 0 ? initial() : importModule(`${url}?chart_retry=${current}`)).catch(
        (error: unknown) => {
          request = undefined;
          throw error;
        },
      );
    }
    // Cada instância lazy recebe sua própria promessa sem repetir o carregamento.
    return request.then((module) => module);
  };
}

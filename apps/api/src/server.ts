import type { FastifyListenOptions } from 'fastify';
import { buildApp, type AppDependencies } from './app.js';
/** T6 must supply the concrete entry and database admission controls. There is
 * intentionally no permissive executable entry point in production. */
export async function iniciarServidor(deps: AppDependencies, options: FastifyListenOptions) {
  const app = await buildApp(deps);
  try {
    await app.listen(options);
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}

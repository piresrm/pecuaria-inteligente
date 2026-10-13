import { serverConfigFromEnvironment } from './config.js';
import { iniciarAplicacao } from './server.js';
try {
  await iniciarAplicacao(serverConfigFromEnvironment(process.env));
} catch {
  // No configuration, socket address, secret path, or database error is logged.
  console.error('Falha ao iniciar a API; verifique a configuração e a disponibilidade do banco.');
  process.exitCode = 1;
}

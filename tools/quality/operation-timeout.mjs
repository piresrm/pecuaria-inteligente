import { spawn } from 'node:child_process';
const command = process.argv[2];
if (!command) throw new Error('Operação obrigatória');
const child = spawn(process.execPath, [command, ...process.argv.slice(3)], { stdio: 'inherit' });
const deadline = setTimeout(() => {
  console.error('Operação excedeu 120 segundos');
  child.kill('SIGKILL');
}, 120000);
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  clearTimeout(deadline);
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  clearTimeout(deadline);
  process.exitCode = code ?? 1;
});

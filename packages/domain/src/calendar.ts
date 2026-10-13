const MILISSEGUNDOS_DIA = 86400000;
// UTC apenas fornece operações de calendário; nenhuma data passa pelo fuso local.
function calendario(data: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data < '0001-01-01' || data > '9999-12-31')
    throw new RangeError('Data civil inválida');
  const resultado = new Date(`${data}T00:00:00.000Z`);
  if (!Number.isFinite(resultado.getTime()) || resultado.toISOString().slice(0, 10) !== data)
    throw new RangeError('Data civil inválida');
  return resultado;
}
export function adicionarDias(data: string, dias: number): string {
  if (!Number.isSafeInteger(dias)) throw new RangeError('Quantidade de dias inválida');
  const resultado = new Date(calendario(data).getTime() + dias * MILISSEGUNDOS_DIA);
  if (
    !Number.isFinite(resultado.getTime()) ||
    resultado.getUTCFullYear() < 1 ||
    resultado.getUTCFullYear() > 9999
  )
    throw new RangeError('Data fora do calendário');
  return resultado.toISOString().slice(0, 10);
}
export function semanasNoIntervalo(inicio: string, fim: string): string[] {
  const primeiro = calendario(inicio);
  calendario(fim);
  if (inicio > fim) throw new RangeError('Intervalo invertido');
  const deslocamento = (8 - primeiro.getUTCDay()) % 7;
  if (primeiro.getTime() + deslocamento * MILISSEGUNDOS_DIA > calendario(fim).getTime()) return [];
  const semanas: string[] = [];
  let semana = adicionarDias(inicio, deslocamento);
  while (semana <= fim) {
    semanas.push(semana);
    if (calendario(fim).getTime() - calendario(semana).getTime() < 7 * MILISSEGUNDOS_DIA) break;
    semana = adicionarDias(semana, 7);
  }
  return semanas;
}

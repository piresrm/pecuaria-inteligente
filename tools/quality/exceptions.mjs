import { readFileSync } from 'node:fs';

const fields = {
  audit: [
    'id',
    'pacote',
    'versao',
    'caminho',
    'motivo',
    'evidencia',
    'revisor',
    'expiraEm',
    'sha256Trecho',
  ],
  semgrep: ['regraId', 'caminho', 'sha256Trecho', 'motivo', 'evidencia', 'revisor', 'expiraEm'],
};

const hasAny = (entry, keys) => keys.some((key) => Object.hasOwn(entry, key));

function exceptionType(entry) {
  const audit = hasAny(entry, ['id', 'pacote', 'versao']);
  const semgrep = Object.hasOwn(entry, 'regraId');
  if (audit && semgrep) throw new Error('exceção ambígua: mistura campos de auditoria e Semgrep');
  if (audit) return 'audit';
  if (semgrep) return 'semgrep';
  throw new Error('exceção sem discriminador reconhecido');
}

function validateEntry(entry, type) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry))
    throw new Error('exceção deve ser um objeto');
  const allowed = fields[type];
  const unexpected = Object.keys(entry).filter((key) => !allowed.includes(key));
  if (unexpected.length)
    throw new Error(`campos não permitidos em exceção ${type}: ${unexpected.join(', ')}`);
  const missing = allowed.filter(
    (key) => typeof entry[key] !== 'string' || entry[key].trim() === '',
  );
  if (missing.length)
    throw new Error(
      `exceção ${type} inválida; campos obrigatórios ausentes: ${missing.join(', ')}`,
    );
  const expiration = new Date(`${entry.expiraEm}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiraEm) ||
    !Number.isFinite(expiration.getTime()) ||
    expiration.toISOString().slice(0, 10) !== entry.expiraEm
  )
    throw new Error(`data de expiração inválida em exceção ${type}`);
  if (!/^[a-f0-9]{64}$/.test(entry.sha256Trecho))
    throw new Error(`hash de trecho inválido em exceção ${type}`);
}

export function classifyExceptions(exceptions) {
  if (!Array.isArray(exceptions)) throw new Error('exceções devem ser uma lista');
  const groups = { audit: [], semgrep: [] };
  for (const entry of exceptions) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw new Error('exceção deve ser um objeto');
    const type = exceptionType(entry);
    validateEntry(entry, type);
    groups[type].push(entry);
  }
  return groups;
}

export function readExceptionGroups(path) {
  let exceptions;
  try {
    exceptions = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`arquivo global de exceções inválido (${error.message})`, { cause: error });
  }
  return classifyExceptions(exceptions);
}

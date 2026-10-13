const response = await fetch(
  new URL(process.argv[2] ?? '/api/v1/mercado/resumo', 'https://localhost'),
  { signal: AbortSignal.timeout(20000) },
);
console.info(
  JSON.stringify({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  }),
);

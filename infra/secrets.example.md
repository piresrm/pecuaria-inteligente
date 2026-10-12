# Local secrets

Run `npm run local:prepare` as the local non-root user to create ignored `.local/secrets/{admin,migracao,publicador,consulta}` files. Existing files are never replaced. Keep the directory mode `0700` and file mode `0600`. Services run with their owner's nonzero UID/GID so passwords remain readable without widening host permissions. Never version passwords or certificate private keys. See README.md for CA extraction, deliberate manual installation/removal, and isolated tests.

For a new installation, PostgreSQL and all secret consumers use `RUNTIME_UID:RUNTIME_GID`. Local commands obtain positive IDs from the invoking host user, including CI users such as UID 1001. Before starting services, the executor checks regular secret files, mode `0600`, matching owner UID/GID, and readability without reading passwords into logs. The official PostgreSQL entrypoint supports this identity when creating a fresh volume.

Keep the same UID/GID for every later start of that database volume. A volume created by another identity requires an explicit manual migration decision. Local commands do not change database-volume ownership or remove existing volumes to repair permissions. No root wrapper or permission widening is provided.

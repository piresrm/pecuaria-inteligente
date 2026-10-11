import { databaseConfigFromEnvironment } from '../config.js';
import { migrateDatabase } from './migrate.js';

await migrateDatabase(databaseConfigFromEnvironment(process.env));

import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config('database', true, true, '/'));

export default db;
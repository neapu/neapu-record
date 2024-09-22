import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config('conf/database.json', true, true, '/'));

export default db;
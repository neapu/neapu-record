import {JsonDB, Config} from "node-json-db";
import Logger from "./logger";

const logger = Logger("database");

const db = new JsonDB(new Config("conf/data.json", true, true, '/'));

class Database {
    public async get(path: string, defaultValue: any) {
        try {
            const exists = await db.exists(path);
            if (!exists) {
                await db.push(path, defaultValue);
                return defaultValue;
            }
            return db.getData(path);
        } catch (e) {
            logger.error(e);
            return defaultValue;
        }
    }

    public async set(path: string, value: any) {
        try {
            await db.push(path, value);
        } catch (e) {
            logger.error(e);
        }
    }
}

const database = new Database();

export default database;
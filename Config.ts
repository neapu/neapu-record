import db from './Database';
import express from 'express';
import logger from './logger';

const router = express.Router();

class Config {
    private saveDir: string = '';

    constructor() {
        db.exists('/config/saveDir').then((ret: boolean)=>{
            if (ret) {
                db.getData('/config/saveDir').then((saveDir: string) => {
                    this.saveDir = saveDir;
                })
            } else {
                return db.push('/config/saveDir', '', true);
            }
        })
        .catch(err => {
            logger.error(err);
        });
    }

    setSaveDir(dir: string) {
        this.saveDir = dir;
        db.push('/config/saveDir', dir, true);
    }

    getSaveDir() {
        return this.saveDir;
    }
}

const config = new Config();

// 描述：获取保存目录
// 请求：GET /api/config/saveDir
// 返回：string
router.get('/saveDir', (req, res) => {
    res.send(config.getSaveDir());
});

// 描述：设置保存目录
// 请求：POST /api/config/setSaveDir
// 请求体：{ saveDir: string }
// 返回：{ success: boolean }
router.post('/setSaveDir', (req, res) => {
    const saveDir = req.body.saveDir;
    if (!saveDir) {
        res.status(400).json({ success: false });
        return;
    }
    config.setSaveDir(saveDir);
    res.json({ success: true });
});

export { config, router as configRouter };
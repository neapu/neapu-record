import axios from "axios";
import fs from "fs";
import Logger from "../tools/logger";

const logger = Logger("record");

// 获取直播间播放地址
const getRoomPlayUrl = 'https://api.live.bilibili.com/room/v1/Room/playUrl';

export class Record {
    constructor(roomId: number, onFinish: (filename: string) => void) {
        this._roomId = roomId;
        this._onFinish = onFinish;
        if (!fs.existsSync("record")) {
            fs.mkdirSync("record");
        }
        setInterval(() => {
            if (this._recording) {
                logger.info(`room: ${this._roomId}, recording ${this._count} bytes`);
            }
        }, 1000);
    }

    private _urls: string[] = [];
    private _recording: boolean = false;
    private _writer: fs.WriteStream | null = null;
    private _count: number = 0;
    private _filename: string = "";
    private readonly _roomId: number;
    private _onFinish: (filename: string) => void;

    public get recording() {
        return this._recording;
    }

    public async getRecordUrls(roomId: number) {
        try {
            const response = await axios.get(`${getRoomPlayUrl}?cid=${roomId}&qn=10000&platform=web`);
            this._urls = response.data.data.durl.map((durl: any) => durl.url);
        } catch (e) {
            logger.error(e);
            this._urls = [];
        }
    }

    public async startRecord() {
        if (this._recording) {
            return null;
        }

        await this.getRecordUrls(this._roomId);

        if (this._urls.length == 0) {
            logger.error(`can not get record urls for room: ${this._roomId}`);
            return null;
        }

        for (const url of this._urls) {
            // record url
            const ret = await this.recordUrl(url);
            if (ret) {
                logger.info(`room: ${this._roomId}, start record ${url}`);
                this._recording = true;
                this._writer?.on('finish', () => {
                    logger.info(`room: ${this._roomId}, record ${this._filename} finished`);
                    this._recording = false;
                    this._onFinish(this._filename);
                });
                this._writer?.on('error', (e)=> {
                    logger.error(`room: ${this._roomId}, record ${this._filename} failed: ${e}`);
                    this._recording = false;
                    // 删除临时文件
                    fs.unlink(this._filename, (err) => {
                        if (err) {
                            logger.error(`room: ${this._roomId}, delete temp file ${this._filename} failed: ${err}`);
                        }
                    });
                    this._onFinish("");
                })
                break;
            }
        }
        if (!this._recording) {
            return null;
        }
        return this._filename;
    }

    private async recordUrl(url: string): Promise<boolean> {
        try {
            const rsp = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                onDownloadProgress: (progressEvent) => {
                    this._count = progressEvent.loaded;
                }
            });
            if (this._writer) {
                this._writer.end();
            }

            const timestamp = new Date().getTime().toString();
            if (rsp.headers['content-type'] == 'video/mp4') {
                this._filename = `record-${timestamp}.mp4`;
            } else if (rsp.headers['content-type'] == 'video/flv') {
                this._filename = `record-${timestamp}.flv`;
            } else if (rsp.headers['content-type'] == 'video/x-flv') {
                this._filename = `record-${timestamp}.flv`;
            }
            this._filename = "record/" + this._filename;
            this._writer = fs.createWriteStream(this._filename);
            rsp.data.pipe(this._writer);
            return true;
        } catch (e) {
            logger.error(`record ${url} failed: ${e}`);
            return false;
        }
    }
}
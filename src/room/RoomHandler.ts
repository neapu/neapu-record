import axios from "axios";
import {Record} from "./record";
import Logger from "../tools/logger";

const logger = Logger("room");

// apis base url
// 获取直播间信息
const getRoomInfoUrl = 'https://api.live.bilibili.com/room/v1/Room/get_info';
// 获取主播信息
const getAnchorInfoUrl = 'https://api.live.bilibili.com/live_user/v1/Master/info';

export interface RoomInfo {
    roomId: number;
    title: string;
    uname: string;
    uid: string;
    liveStatus: boolean;
    recording?: boolean;
    listening?: boolean;
}

export class RoomHandler {
    constructor(info: RoomInfo) {
        this._info = info;
        this._info.recording = false;
        this._record = new Record(info.roomId, (filename)=>{
            this._info.recording = false;
            logger.info(`room: ${this._info.roomId}, record finished, filename: ${filename}`);
        });
    }

    private _info: RoomInfo = {
        roomId: 0,
        title: "",
        uname: "",
        uid: "",
        liveStatus: false,
        recording: false,
        listening: false,
    }
    private _record: Record;

    public get info() {
        return this._info;
    }

    private static async requestRoomInfo(roomId: number) {
        try {
            const response = await axios.get(`${getRoomInfoUrl}?room_id=${roomId}`);
            const info: RoomInfo = {
                roomId,
                title: response.data.data.title,
                uname: "",
                uid: response.data.data.uid,
                liveStatus: response.data.data.live_status === 1
            }
            // console.log(JSON.stringify(response.data.data));
            console.log(`title: ${info.title}, uid: ${info.uid}, liveStatus: ${info.liveStatus}`);
            return info;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    public static async requestUserName(uid: string) {
        try {
            const response = await axios.get(`${getAnchorInfoUrl}?uid=${uid}`);
            return response.data.data.info.uname as string;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    public static async fromRoomId(roomId: number) {
        const info = await this.requestRoomInfo(roomId);
        if (!info) {
            return null;
        }
        const uname = await this.requestUserName(info.uid);
        if (!uname) {
            return null;
        }

        info.uname = uname;
        info.recording = false;
        info.listening = true;
        return new RoomHandler(info);
    }

    // public static async requestPlayUrls(roomId: number) {
    //     try {
    //         const response = await axios.get(`${getRoomPlayUrl}?cid=${roomId}&qn=10000&platform=web`);
    //         return response.data.data.durl.map((item: any) => item.url);
    //     } catch (e) {
    //         console.error(e);
    //         return null;
    //     }
    // }

    public async update() {
        logger.info(`room: ${this._info.roomId}, update`);
        const info = await RoomHandler.requestRoomInfo(this._info.roomId);
        if (!info) {
            logger.error(`room: ${this._info.roomId}, update failed`);
            return;
        }

        this._info.title = info.title;
        this._info.liveStatus = info.liveStatus;
        logger.info(`room: ${this._info.roomId}, liveStatus: ${this._info.liveStatus}`);

        if (this._info.listening) {
            await this.startRecord();
        }
    }

    public async startRecord() {
        if (!this._info.liveStatus) {
            return;
        }

        if (this._record.recording) {
            return;
        }

        const ret = await this._record.startRecord();
        if (ret) {
            this._info.recording = true;
            logger.info(`room: ${this._info.roomId}, start record`);
        }
    }
}
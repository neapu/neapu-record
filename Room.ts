import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import logger from './logger';
import {config} from './Config';
import {events} from './Events';

// apis base url
// 获取直播间信息
const getRoomInfoUrl = 'https://api.live.bilibili.com/room/v1/Room/get_info';
// 获取直播间播放地址
const getRoomPlayUrl = 'https://api.live.bilibili.com/room/v1/Room/playUrl';
// 获取直播间状态
const getRoomStatusUrl = 'https://api.live.bilibili.com/room/v1/Room/room_init';
// 获取主播信息
const getAnchorInfoUrl = 'https://api.live.bilibili.com/live_user/v1/Master/info';

export interface RoomInfo {
    roomId: string;
    title: string;
    uid: string;
    uname: string;
    recording: boolean;
    liveStatus: boolean;
    listening: boolean;
}

export class Room {
    private roomId: string;
    private roomTitle: string = '';         // 直播间标题
    private liveStatus: boolean = false;    // 是否正在直播
    private uid: string = '';               // 主播uid
    private uname: string = '';             // 主播名
    private listening: boolean = true;     // 是否监听开播自动录制
    private recording: boolean = false;     // 是否正在录制
    private urls: string[] = [];
    private recordUrlIndex: number = 0;
    private ffmpegCommand: ffmpeg.FfmpegCommand | null = null;
    public recordStatusChangeCallback: (recording: boolean) => void = () => { };

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    // 获取直播间信息，主要是为了获取直播间标题和主播uid，直播状态
    async requestRoomInfo() {
        try {
            const response = await axios.get(`${getRoomInfoUrl}?room_id=${this.roomId}`);
            this.roomTitle = response.data.data.title;
            this.uid = response.data.data.uid.toString();
            this.liveStatus = response.data.data.live_status === 1;
        } catch (err) {
            logger.error(err);
            throw new Error('Failed to get room info');
        }
    }

    // 获取主播信息，主要是为了获取主播名
    async requestAnchorInfo() {
        if (!this.uid) {
            logger.error('uid is required');
            throw new Error('uid is required');
        }
        try {
            const response = await axios.get(`${getAnchorInfoUrl}?uid=${this.uid}`);
            this.uname = response.data.data.info.uname;
        } catch (err) {
            logger.error(err);
            throw new Error('Failed to get anchor info');
        }
    }

    async requestRoomPlayUrl() {
        try {
            const response = await axios.get(`${getRoomPlayUrl}?cid=${this.roomId}&qn=10000&platform=web`);
            this.urls = response.data.data.durl.map((item: any) => item.url);
        } catch (err) {
            logger.error(err);
            throw new Error('Failed to get room play url');
        }
    }

    // // 获取直播间状态，主要是为了判断是否正在直播
    // async requestRoomStatus() {
    //     try {
    //         const response = await axios.get(`${getRoomStatusUrl}?room_id=${this.roomId}`);
    //         console.log(response.data.data);
    //         this.liveStatus = response.data.data.live_status === 1;
    //     } catch (err) {
    //         logger.error(err);
    //         throw new Error('Failed to get room status');
    //     }
    // }

    async init() {
        await this.requestRoomInfo();
        await this.requestAnchorInfo();
        if (this.listening && this.liveStatus) {
            await this.requestRoomPlayUrl();
        }
    }

    getRoomInfo(): RoomInfo {
        return {
            roomId: this.roomId,
            title: this.roomTitle,
            uid: this.uid,
            uname: this.uname,
            recording: this.recording,
            liveStatus: this.liveStatus,
            listening: this.listening,
        };
    }

    getRoomId() {
        return this.roomId;
    }

    async startRecord() {
        if (this.recording) {
            throw new Error('Recording is already started');
        }

        if (!this.urls) {
            await this.requestRoomPlayUrl();
        }

        if (!config.getSaveDir()) {
            throw new Error('Output directory is required');
        }

        if (this.urls.length <= this.recordUrlIndex) {
            return;
        }

        // 输出文件名为：主板名-时间戳.flv
        const outputFileName = `${this.uname}-${Date.now()}.flv`;
        const outputFilePath = `${config.getSaveDir()}/${outputFileName}`;

        this.ffmpegCommand = ffmpeg()
            .input(this.urls[this.recordUrlIndex])
            .inputOptions(['-re'])
            .outputOptions(['-c:v copy', '-c:a copy'])
            .output(outputFilePath)
            .on('end', () => {
                logger.info('Recording finished');
                this.recording = false;
                this.recordUrlIndex = 0;
                this.ffmpegCommand = null;
                this.recordStatusChangeCallback(false);
                events.sendEvent('room_status_change', this.getRoomInfo());
            })
            .on('error', (err: Error) => {
                this.ffmpegCommand = null;
                this.recording = false;
                logger.error(`Recording error: ${err.message}`);
                if (err.message.includes('403 Forbidden')) {
                    this.recordUrlIndex++;
                    this.startRecord();
                } else {
                    this.recordUrlIndex = 0;
                    this.recordStatusChangeCallback(false);
                    events.sendEvent('room_status_change', this.getRoomInfo());
                }
            })
            .on('start', () => {
                this.recording = true;
                this.recordStatusChangeCallback(true);
                events.sendEvent('room_status_change', this.getRoomInfo());
                logger.info(`Recording started, room: ${this.roomId}, url index: ${this.recordUrlIndex}`);
            });
        this.ffmpegCommand.run();
    }

    stopRecord() {
        if (this.ffmpegCommand) {
            this.ffmpegCommand.kill('SIGKILL');
        }
    }

    async check() {
        if (this.listening && !this.recording) {
            await this.requestRoomInfo();
            if (this.liveStatus) {
                await this.requestRoomPlayUrl();
                try {
                    await this.startRecord();
                } catch (err: any) {
                    events.sendEvent('error', { message: err.message });
                }
            }
        } else if (!this.listening && this.recording) {
            this.stopRecord();
        }
    }

    setListening(listening: boolean) {
        this.listening = listening;
    }
}
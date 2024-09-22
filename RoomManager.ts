import express from 'express';
import { Room, RoomInfo } from './Room';
import logger from './logger';
import db from './Database';

class RoomManager {
    private rooms: Room[] = [];
    private checkInterval = 2 * 60 * 1000;
    private checkTimer: NodeJS.Timeout | null = null;

    constructor() {
        db.exists('/rooms').then(ret=>{
            if (ret) {
                db.getData('/rooms').then((rooms: string[]) => {
                    rooms.forEach(roomId => {
                        const room = new Room(roomId);
                        try {
                            room.init().then(() => {
                                this.rooms.push(room);
                            });
                        } catch (err) {
                            logger.error(err);
                        }
                    });
        
                    this.checkTimer = setInterval(() => {
                        this.checkRooms();
                    }, this.checkInterval);
                    this.checkRooms();
                })
            } else {
                return db.push('/rooms', [], true);
            }
        })
        .catch(err=>{
            logger.error(err);
        })
    }

    async addRoom(roomId: string) {
        const room = new Room(roomId);
        try {
            await room.init();
        } catch (err) {
            logger.error(err);
            throw new Error('Failed to init room');
        }
        this.rooms.push(room);
        db.push(`/rooms`, this.rooms.map(room => room.getRoomId()), true);
        room.check();
    };

    getRooms(): RoomInfo[] {
        return this.rooms.map(room => room.getRoomInfo());
    }

    removeRoom(roomId: string) {
        const index = this.rooms.findIndex(room => room.getRoomId() === roomId);
        if (index === -1) {
            throw new Error('Room not found');
        }
        this.rooms[index].stopRecord();
        this.rooms.splice(index, 1);
        db.push(`/rooms`, this.rooms.map(room => room.getRoomId()), true);
    }

    checkRooms() {
        this.rooms.forEach(room => {
            room.check();
        });
    }

    changeRoomStatus(roomId: string, listening: boolean) {
        const room = this.rooms.find(room => room.getRoomId() === roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        room.setListening(listening);
        room.check();
    }
}

const roomManager = new RoomManager();

const router = express.Router();

router.use(express.json());

// 描述：添加要录制的直播间
// 请求：POST /api/addRoom
// 请求体：{ roomId: string }
// 响应：{ success: boolean, message?: string }
router.post('/addRoom', async (req, res) => {
    const roomId = req.body.roomId;
    try {
        await roomManager.addRoom(roomId);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 描述：获取所有直播间
// 请求：GET /api/getRooms
// 响应：{ roomId: string }[]
router.get('/getRooms', (req, res) => {
    res.json(roomManager.getRooms());
});

// 描述: 获取直播间信息
// 请求: GET /api/getRoomInfo
// 请求参数: roomId: string
// 响应: { roomId: string, title: string, uname: string, recording: boolean }
router.get('/getRoomInfo', (req, res) => {
    const roomId = req.query.roomId;
    if (!roomId) {
        res.status(400).send('roomId is required');
        return;
    }
    res.json({ roomId, title: 'title', uname: 'uname', recording: true });
});

// 描述: 删除直播间
// 请求: POST /api/removeRoom
// 请求体: { roomId: string }
// 响应: { success: boolean, message?: string }
router.post('/removeRoom', (req, res) => {
    const roomId = req.body.roomId;
    if (!roomId) {
        res.status(400).send('roomId is required');
        return;
    }
    try {
        roomManager.removeRoom(roomId);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 描述: 修改房间监听状态
// 请求: POST /api/changeRoomStatus
// 请求体: { roomId: string, listening: boolean }
// 响应: { success: boolean, message?: string }
router.post('/changeRoomStatus', (req, res) => {
    const roomId = req.body.roomId;
    const listening = req.body.listening;
    if (!roomId) {
        res.status(400).send('roomId is required');
        return;
    }
    if (listening === undefined) {
        res.status(400).send('listening is required');
        return;
    }
    try {
        roomManager.changeRoomStatus(roomId, listening);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
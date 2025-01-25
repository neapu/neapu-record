import database from "../tools/database";
import {RoomHandler, RoomInfo} from "./RoomHandler";

// 刷新间隔10秒
const updateInterval = 10000;

class RoomManager {
    private _rooms: RoomHandler[] = [];

    constructor() {
        database.get("/rooms", []).then((rooms: RoomInfo[]) => {
            rooms.forEach((room) => {
                this._rooms.push(new RoomHandler(room));
            });
            setInterval(() => {
                this.updateRooms().then(() => {
                    console.log("rooms updated");
                })
            }, updateInterval);
            this.updateRooms().then(() => {
                console.log("rooms updated");
            })
        });
        
    }

    public async updateRooms() {
        for (const room of this._rooms) {
            await room.update();
        }
        await database.set("/rooms", this._rooms.map((room) => room.info));
    }

    public getRoomsInfo() {
        return this._rooms.map((room) => room.info);
    }

    public async addRoom(roomId: number) : Promise<string | null> {
        for (const room of this._rooms) {
            if (room.info.roomId === roomId) {
                return "直播间已存在";
            }
        }
        const room = await RoomHandler.fromRoomId(roomId);
        if (!room) {
            return "获取直播间信息失败";
        }
        this._rooms.push(room);
        await database.set("/rooms", this._rooms.map((room) => room.info));
        return null;
    }

    public async deleteRoom(roomId: number) : Promise<string | null> {
        for (let i = 0; i < this._rooms.length; i++) {
            if (this._rooms[i].info.roomId === roomId) {
                this._rooms[i].stopRecord();
                this._rooms.splice(i, 1);
                await database.set("/rooms", this._rooms.map((room) => room.info));
                return null;
            }
        }
        return "直播间不存在";
    }

    public async setRoomListenStatus(roomId: number, listening: boolean) : Promise<string | null> {
        for (const room of this._rooms) {
            if (room.info.roomId === roomId) {
                await room.setListenStatus(listening);
                return null;
            }
        }
        return "直播间不存在";
    }
}

const roomManager = new RoomManager();

export default roomManager;
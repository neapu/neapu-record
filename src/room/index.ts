import {Router} from 'express'
import roomManager from "./RoomManager";

const router = Router();

router.get('/roomList', async (req, res) => {
    // await roomManager.updateRooms();
    const roomList = roomManager.getRoomsInfo();
    // console.log(roomList);
    res.json({
        code: 0,
        data: roomList
    });
});

router.post('/addRoom', async (req, res) => {
    const roomId = req.body.roomId;
    if (!roomId) {
        res.status(400).send("Invalid room id");
        return;
    }
    const ret = await roomManager.addRoom(roomId);
    res.send({
        code: ret === null ? 0 : -1,
        data: ret ? ret : "success"
    });
});

export default router;
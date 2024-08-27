import express from 'express';
import roomManager from './RoomManager';
import { configRouter } from './Config';
import { eventsRouter } from './Events';

const app = express();
app.use(express.json());
app.use('/api/room', roomManager);
app.use('/api/config', configRouter);
app.use('/api/events', eventsRouter);

app.listen(7001, () => {
    console.log('Server is running on port 7001');
});
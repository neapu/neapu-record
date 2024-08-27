import express from 'express';

const router = express.Router();

class Events {
    private events: string[] = [];
    private connected: boolean = false;

    sendEvent(type: string, data: any) {
        // 发送事件
        if (!this.connected) {
            return;
        }
        this.events.push(JSON.stringify({ type, data }));
    }

    popEvent() {
        // 弹出事件
        return this.events.shift();
    }

    setConnected(connected: boolean) {
        this.connected = connected;
    }
}

const events = new Events();

// SSE通道
router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write('data: {"type":"connected"}\n\n');
    events.setConnected(true);
    
    const interval = setInterval(() => {
        res.write('data: {"type":"ping"}\n\n');
    }, 10000);

    const eventInterval = setInterval(() => {
        const event = events.popEvent();
        if (event) {
            res.write(`data: ${event}\n\n`);
        }
    }, 1000);

    req.on('close', () => {
        events.setConnected(false);
        clearInterval(interval);
        clearInterval(eventInterval);
    });
});

export { router as eventsRouter, events };
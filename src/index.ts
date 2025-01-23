import express from 'express';
import room from './room';

const app = express();
app.use(express.json());

// 打印所有请求
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.use('/api/room', room);

app.listen(7840, () => {
  console.log('Server is running on http://localhost:7840');
});
import express from 'express';
import room from './room';
import fs from 'fs';

if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

const app = express();
app.use(express.json());

// 打印所有请求
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.get('/', (req, res) => {
    res.redirect('/web/index.html');
});

app.use('/web', express.static('web'));
app.use('/api/room', room);

app.listen(7840, () => {
  console.log('Server is running on http://localhost:7840');
});
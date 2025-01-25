# Neapu Record

A tool for recording Bilibili live streams.

一个录制Bilibili直播的工具。

## Usage

```
yarn
yarn dev
# or
npm install
npm run dev
```

然后访问`IP:7840`即可打开控制台页面。

## Docker

创建容器

```shell
docker build --build-arg USER_UID=$(id -u) -t neapu_record .
```

运行容器

```shell
docker run -v /local/path:/app/record -p 7840:7840 -d neapu_record
```

## About console page

[neapu-record-web](https://github.com/neapu/neapu-record-web)
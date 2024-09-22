FROM ubuntu:22.04

WORKDIR /app

RUN apt update

RUN apt install nodejs npm curl ca-certificates -y

RUN npm install -g n

RUN n stable

RUN apt install ffmpeg -y

COPY *.ts *.json /app/

COPY static /app/static

EXPOSE 7001

RUN npm install

RUN npm install typescript -g

RUN tsc

CMD [ "node", "dist/index.js" ]
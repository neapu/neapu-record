FROM ubuntu:22.04

RUN apt update

RUN apt install nodejs npm curl ca-certificates -y

RUN npm install -g n

RUN n stable

RUN apt install ffmpeg -y

RUN npm install typescript -g

ARG USER_UID=1000

RUN useradd -r -u ${USER_UID} -m -d /app record

USER record

WORKDIR /app

COPY *.ts *.json /app/

COPY static /app/static

EXPOSE 7001

RUN npm install



RUN tsc

CMD [ "node", "dist/index.js" ]
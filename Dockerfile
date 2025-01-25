FROM ubuntu:22.04

RUN apt update

RUN apt install nodejs npm curl ca-certificates -y

RUN npm install -g n

RUN n stable

RUN npm install typescript -g

ARG USER_UID=1000

RUN useradd -r -u ${USER_UID} -m -d /app record

USER record

WORKDIR /app

COPY src /app/src
COPY scripts /app/scripts
COPY tsconfig.json /app
COPY package.json /app

RUN /bin/bash /app/scripts/build_web.sh

EXPOSE 7840

RUN npm install

RUN tsc

CMD [ "node", "dist/index.js" ]
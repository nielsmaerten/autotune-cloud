FROM node:alpine
ARG PORT=3000
ENV PORT=$PORT

RUN apk update && \
    apk add bash bc coreutils curl git jq tzdata sudo && \
    mkdir /openaps && \
    touch /etc/localtime && \
    chown -Rh node:node /openaps/ /etc/localtime

RUN git clone --branch v0.6.3 https://github.com/openaps/oref0
WORKDIR /oref0
RUN npm run global-install

COPY api/ /api/
WORKDIR /api
RUN npm install

COPY entrypoint.sh /entrypoint.sh
USER node
CMD ["node", "index.js"]

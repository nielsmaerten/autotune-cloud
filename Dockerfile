FROM node:12.3.1-alpine
ARG PORT=3000
ENV PORT=$PORT
ARG TIMEOUT=600
ENV TIMEOUT=$TIMEOUT

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

USER node
CMD ["node", "index.js"]

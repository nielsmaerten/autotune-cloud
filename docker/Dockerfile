FROM node:12.3.1-alpine
ARG PORT=3000
ENV PORT=$PORT

# Max allowed timeout for Cloud Functions: 9 minutes
# NB: CloudRun allows 15 minutes, but in my current implementation the cloud function
# awaits the result from CloudRun, so we're limited to 9 minutes.
ARG TIMEOUT=540
ENV TIMEOUT=$TIMEOUT

RUN apk update && \
    apk add bash bc coreutils curl git jq tzdata sudo && \
    mkdir /openaps && \
    chown -Rh node:node /openaps/

RUN git clone --branch v0.7.0 https://github.com/openaps/oref0
WORKDIR /oref0
RUN npm run global-install

COPY api/ /api/
WORKDIR /api
RUN npm install

USER node
CMD ["node", "index.js"]

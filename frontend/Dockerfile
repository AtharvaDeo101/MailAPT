FROM node:20-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
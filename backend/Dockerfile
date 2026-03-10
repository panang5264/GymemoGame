# Base image
FROM node:18-alpine

# create app directory
WORKDIR /app

# install dependencies first (better cache)
COPY backend/package*.json ./

# install only production dependencies
RUN npm ci --omit=dev

# copy source code
COPY backend/ .

# environment
ENV NODE_ENV=production

# expose port
EXPOSE 3001

# run server
CMD ["node", "src/server.js"]
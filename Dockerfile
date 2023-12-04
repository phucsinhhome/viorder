FROM node:18-alpine3.16

ARG REACT_APP_INVOICE_SERVICE_ENDPOINT
ARG REACT_APP_PROFIT_SERVICE_ENDPOINT
ARG REACT_APP_EXPENSE_SERVICE_ENDPOINT
ARG REACT_APP_SERVICE_CLASSIFICATION_ENDPOINT
ARG WDS_SOCKET_PORT
ARG REACT_APP_FILE_SERVICE_ACCESS_KEY
ARG REACT_APP_FILE_SERVICE_SECRET_KEY

WORKDIR /app
COPY . .
# ==== BUILD =====
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN npm ci 
# Build the app
RUN npm run build
# ==== RUN =======
# Set the env to "production"

ENV NODE_ENV production
ENV REACT_APP_DEBUG=$REACT_APP_DEBUG
# Expose the port on which the app will be running (3000 is the default that `serve` uses)
EXPOSE 3000
# Start the app
ENTRYPOINT [ "npm", "run", "start" ]
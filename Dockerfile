# Use the official Node.js image as the base image
FROM node:16.14.0-alpine 

# Install Puppeteer dependencies via apk
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libjpeg-turbo \
    udev \
    dumb-init \
    bash

# Set Puppeteer executable path environment variable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application files
COPY . .

# Expose the port
EXPOSE 3009

# Start the application
CMD [ "dumb-init", "node", "app.js" ]
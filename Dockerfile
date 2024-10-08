# Fetching the minified node image on apline linux
FROM node:slim



# Setting up the work directory
WORKDIR /express-docker

COPY package*.json ./

# Installing dependencies
RUN npm install

# Copying all the dist files 
COPY . .

RUN npm run build
# Declaring env
ENV NODE_ENV production

# Start the application with node
CMD [ "node", "dist/src/index.js" ]

# Exposing server port
EXPOSE 8080
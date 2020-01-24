FROM node:13.7.0

COPY . /home/node/green
WORKDIR /home/node/green
RUN apt update
RUN apt install redis-server -y
RUN npm install -g gulp
RUN yarn install
RUN gulp
COPY . .
EXPOSE 8080
CMD ["redis-server", "&", "node" , "./dist"]

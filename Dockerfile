FROM node:current-alpine

COPY . /home/node/green
WORKDIR /home/node/green
RUN npm install -g gulp
RUN npm install --save-dev
RUN npm rebuild node-sass
RUN gulp
COPY . .
EXPOSE 8080
EXPOSE 5432
CMD ["npm" , "run"]

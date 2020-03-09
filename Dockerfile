
FROM golang:alpine AS build-env-dynamic

RUN apk add npm

RUN npm install @kubernetes/client-node

WORKDIR /app

ADD webserv  /app/webserv
ADD css      /app/css
ADD js       /app/js
ADD images   /app/images
ADD pod.html /app/index.html

RUN mkdir /root/.kube

EXPOSE 80

#CMD ["/app/webserv","--listen",":80","-l","0","-r","0"]
CMD ["/app/webserv"]


FROM php:8.2-cli-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY server.php /app/server.php
EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/app"]

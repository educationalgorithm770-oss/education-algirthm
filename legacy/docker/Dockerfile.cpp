# Dockerfile.cpp — Sandbox Execution Container for C++20
FROM alpine:3.19
RUN apk add --no-cache g++ libstdc++
RUN adduser -D -u 1000 nonroot
USER nonroot
WORKDIR /tmp
CMD ["g++"]

FROM alpine:3.20

# Install real runtimes & compilers for all supported languages: Python, Node.js, OpenJDK 21, GCC/G++, SQLite
RUN apk add --no-cache \
    python3 \
    nodejs \
    openjdk21-jdk \
    g++ \
    gcc \
    sqlite \
    && addgroup -S sandbox && adduser -S -G sandbox -u 65532 sandbox

USER sandbox
COPY sql_runner.py /usr/local/bin/sql_runner.py
RUN chmod 0555 /usr/local/bin/sql_runner.py

WORKDIR /workspace
ENTRYPOINT ["/bin/sh", "-c"]

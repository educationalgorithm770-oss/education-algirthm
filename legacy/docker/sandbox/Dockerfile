# docker/sandbox/Dockerfile — Enterprise Code Arena Unified Multi-Language Sandbox Image
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install JDK 21, Python 3, g++, Node.js, and core runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jdk-headless \
    python3 \
    g++ \
    nodejs \
    npm \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root runner user (UID 10001) for isolated sandbox execution
RUN useradd -m -u 10001 -s /bin/false runner

WORKDIR /sandbox
RUN chown -R runner:runner /sandbox

USER runner

# Default entrypoint
CMD ["/bin/bash"]

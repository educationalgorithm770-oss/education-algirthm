# Dockerfile.java — Sandbox Execution Container for Java 21
FROM eclipse-temurin:21-alpine
RUN adduser -D -u 1000 nonroot
USER nonroot
WORKDIR /tmp
CMD ["java"]

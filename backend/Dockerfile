# ==============================================================================
# Multi-Stage Dockerfile: Generic Community & Temple Ledger Backend
# Build Stage: Maven 3.9 + Eclipse Temurin JDK 17 (Alpine)
# Runtime Stage: Eclipse Temurin JRE 17 (Alpine)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application
# ------------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Cache dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy application source code
COPY src ./src

# Package application into executable JAR (skipping test suite in build container)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime Container
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runner

WORKDIR /app

# Create dedicated non-root application user and group for hardened security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Enforce secure non-root file ownership
RUN chown -R appuser:appgroup /app

# Switch to non-privileged user
USER appuser

# Expose HTTP port
EXPOSE 8080

# Configure JVM container memory flags and entropy
ENV PORT=8080 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"

# Health check probe against public summary endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/api/v1/public/dashboard/summary || exit 1

# Launch application
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

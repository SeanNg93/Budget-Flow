FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy gradle files first for better caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Install gradle
RUN apk add --no-cache gradle

# Copy source
COPY src ./src

# Build the application
RUN gradle build --no-daemon -x test

# Final stage - smaller image with JRE only
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built artifact
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

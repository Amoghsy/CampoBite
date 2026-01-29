FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY . .

RUN mvn clean package

EXPOSE 8080

ENTRYPOINT ["java","-jar","target/*.jar"]

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S backend_user
RUN adduser -S backend_user -u 1001

# Change ownership of the app directory
RUN chown -R backend_user:backend_user /app
USER backend_user

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

# Dockerfile pour Railway - Backend Only
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers du backend
COPY backend/package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source du backend
COPY backend/ .

# Compiler TypeScript
RUN npm run build

# Exposer le port dynamique de Railway
EXPOSE $PORT

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Démarrer l'application
CMD ["npm", "start"]
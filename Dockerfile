# Dockerfile pour Railway - Backend Only
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers du backend
COPY backend/package*.json ./

# Installer toutes les dépendances (y compris tsx pour runtime)
RUN npm ci

# Copier le code source du backend
COPY backend/ .

# Exposer le port dynamique de Railway
EXPOSE $PORT

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Démarrer l'application directement avec tsx (skip build)
CMD ["npx", "tsx", "src/index.ts"]
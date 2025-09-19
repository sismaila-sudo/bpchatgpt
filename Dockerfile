# Dockerfile pour Railway - Backend Only
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers du backend
COPY backend/package*.json ./

# Installer toutes les dépendances (y compris tsx pour runtime)
RUN npm ci

# Copier le code source du backend
COPY backend/ .

# Installer tsx globalement pour s'assurer qu'il est disponible
RUN npm install -g tsx

# Exposer le port dynamique de Railway
EXPOSE $PORT

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Démarrer l'application avec gestion d'erreurs
CMD ["sh", "-c", "echo 'Starting app on port $PORT' && tsx src/index.ts"]
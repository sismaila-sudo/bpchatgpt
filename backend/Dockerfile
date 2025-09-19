# Dockerfile pour Railway
FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Exposer le port dynamique de Railway
EXPOSE $PORT

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Démarrer l'application
CMD ["npm", "start"]
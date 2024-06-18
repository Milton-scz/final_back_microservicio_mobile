# Etapa de construcción
FROM node:19.6.0 AS build

# Crear y cambiar al directorio de trabajo
WORKDIR /usr/src/backactivoscznode

# Copiar el package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Construir la aplicación (si es necesario)
# RUN npm run build

# Etapa de ejecución
FROM node:19.6.0-slim

# Crear y cambiar al directorio de trabajo
WORKDIR /usr/src/backactivoscznode

# Copiar las dependencias instaladas y el código fuente
COPY --from=build /usr/src/backactivoscznode ./

# Exponer el puerto de la aplicación
EXPOSE 2000

# Definir el comando de inicio
CMD ["npm", "start"]

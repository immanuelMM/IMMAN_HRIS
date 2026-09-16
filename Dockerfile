# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build the .NET backend ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src/backend
COPY backend/HRIS.Api/HRIS.Api.csproj ./HRIS.Api/
RUN dotnet restore ./HRIS.Api/HRIS.Api.csproj
COPY backend/HRIS.Api/ ./HRIS.Api/
RUN dotnet publish ./HRIS.Api/HRIS.Api.csproj -c Release -o /app/publish

# ---- Stage 3: runtime image serving both API and frontend ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /src/frontend/dist ./wwwroot

EXPOSE 8080
ENTRYPOINT ["dotnet", "HRIS.Api.dll"]

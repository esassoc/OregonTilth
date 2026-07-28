FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
COPY OregonTilth.Web/.nvmrc                        ./OregonTilth.Web/.nvmrc
RUN NODE_VERSION=$(cat OregonTilth.Web/.nvmrc) \
    && echo "Installing Node Version: ${NODE_VERSION}" \
    && curl -SL "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz" --output nodejs.tar.gz \
    && curl -SL "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt" --output SHASUMS256.txt \
    && grep "linux-x64.tar.gz" SHASUMS256.txt > sha-sum.txt \
    && NODE_DOWNLOAD_SHA=$(awk '{print $1}' sha-sum.txt) \
    && echo "${NODE_DOWNLOAD_SHA} nodejs.tar.gz" | sha256sum -c - \
    && tar -xzf "nodejs.tar.gz" -C /usr/local --strip-components=1 \
    && rm nodejs.tar.gz SHASUMS256.txt sha-sum.txt \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs

    
COPY OregonTilth.Web/                        ./OregonTilth.Web

RUN dotnet restore OregonTilth.Web/OregonTilth.Web.csproj

RUN dotnet build ./OregonTilth.Web/OregonTilth.Web.csproj -c Release -o /app
WORKDIR /src/OregonTilth.Web/

RUN npm cache clean --force
RUN npm ci

ARG env
RUN npm run build-${env}

FROM build AS publish
RUN dotnet publish OregonTilth.Web.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "OregonTilth.Web.dll"]

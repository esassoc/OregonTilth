FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-env

WORKDIR /src
COPY ./OregonTilth.Models ./OregonTilth.Models
COPY ./OregonTilth.EFModels ./OregonTilth.EFModels
COPY ./OregonTilth.API ./OregonTilth.API

RUN dotnet publish ./OregonTilth.API/OregonTilth.API.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-env /app /app
EXPOSE 8080
EXPOSE 8081
ENTRYPOINT ["dotnet", "OregonTilth.API.dll"]

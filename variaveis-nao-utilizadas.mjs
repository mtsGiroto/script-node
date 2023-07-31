import axios from "axios";
import readline from "readline";

const http = axios.create({
  baseURL: "https://apis-dev.mag.com.br",
  headers: {
    client_id: "************",
  },
});

const httpWithHeader = axios.create({
  baseURL: "https://manager-mongeral.sensedia.com",
  headers: {
    "Sensedia-Auth": "************",
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const extractApiNameFromFirstApi = (api) => {
  let name = api.Api || "";
  const cleanedName = name.replace(/[.\s0-9vV]+/g, "").trim();
  return cleanedName;
};

const extractApiNamesFromSecondApi = (mapVars) => {
  const apiNames = [];

  for (const mapVar of mapVars) {
    if (mapVar && mapVar.name) {
      let name = mapVar.name.replace(/[.\s0-9vV]+/g, "").trim();
      apiNames.push(name);
    }
  }

  return apiNames;
};

const getFirstApiData = async (pathVariable) => {
  try {
    const response = await http.get(
      `/dev-utils/v1/apis/${pathVariable}/env-variables`,
      {
        params: {
          only_vars: "true",
        },
      }
    );

    const data = response.data;
    return data;
  } catch (error) {
    console.error("Erro na primeira API:", error);
    return null;
  }
};

const getSecondApiData = async () => {
  try {
    const response = await httpWithHeader.get(
      "/api-manager/api/v3/environments/10"
    );
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Erro na segunda API:", error);
    return null;
  }
};

const getInput = () => {
  return new Promise((resolve) => {
    rl.question("Digite o ID da api: ", (pathVariable) => {
      resolve(pathVariable);
    });
  });
};

const compareVariables = (firstApiVariables, secondApiVariables) => {
  const differentVariables = [];

  for (const secondApiVar of secondApiVariables) {
    let found = false;

    for (const firstApiVar of firstApiVariables) {
      if (firstApiVar === secondApiVar) {
        found = true;
        break;
      }
    }

    if (!found) {
      differentVariables.push(secondApiVar);
    }
  }

  return differentVariables;
};

const main = async () => {
  const pathVariable = await getInput();
  const firstApiData = await getFirstApiData(pathVariable);
  const secondApiData = await getSecondApiData();

  if (firstApiData && secondApiData) {
    const firstApiName = extractApiNameFromFirstApi(firstApiData);
    const secondApiNames = extractApiNamesFromSecondApi(secondApiData.mapVars);

    const backendFirstApiName = "Backend" + firstApiName;

    console.log("Nome da API na primeira API:", firstApiName);
    console.log("Nome da primeira API com 'Backend':", backendFirstApiName);

    console.log("Variáveis da primeira API:");
    console.log(firstApiData.variables);

    const matchingApis = secondApiData.mapVars.filter((mapVar) => {
      const cleanedName = mapVar.name.replace(/[.\s0-9vV]+/g, "").trim();
      return (
        cleanedName === firstApiName || cleanedName === backendFirstApiName
      );
    });

    const matchingApiIds = matchingApis.map((api) => api.id);

    console.log("IDs e nomes das APIs correspondentes na segunda API:");
    const matchingApiData = matchingApis.map((api) => ({
      id: api.id,
      name: api.name,
    }));
    console.log(matchingApiData);

    console.log("Valores de key das variáveis correspondentes na segunda API:");
    const matchingApiVars = [];

    for (const matchingApiId of matchingApiIds) {
      const matchingApi = secondApiData.mapVars.find(
        (mapVar) => mapVar.id === matchingApiId
      );

      if (matchingApi && matchingApi.vars) {
        const varKeys = matchingApi.vars.map((varData) => varData.key);
        matchingApiVars.push(...varKeys);
        console.log(`ID ${matchingApiId}:`, varKeys);
      }
    }

    if (firstApiData.variables) {
      const differentVariables = compareVariables(
        firstApiData.variables,
        matchingApiVars
      );

      console.log(
        "Variaveis não utilizadas no mapa de ambiente:",
        differentVariables
      );
    }
  }

  rl.close();
};

main();

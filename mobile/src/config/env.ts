/** Endereço da API. Só variáveis EXPO_PUBLIC_ chegam ao bundle; o valor é fixado no build. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api";

/** Origem do servidor, usada para montar a URL das fotos em /uploads. */
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

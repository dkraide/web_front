import axios, { AxiosError } from 'axios';
import { parseCookies } from 'nookies';
import { AuthTokenError } from './errors/AuthTokenError';
import { signOut } from '../contexts/AuthContext';

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx);
    const baseURL =
        process.env.NODE_ENV === "development"
            ? "http://localhost:7020/api"
            : "https://pdv.krdsys.tech/api";

    const api = axios.create({
        baseURL: baseURL,
        headers: {
            Authorization: `Bearer ${cookies['@web_front.token']}`,
        }
    });
    // O token é lido a cada request: após login/troca de sessão não depende do header fixado na criação.
    api.interceptors.request.use(config => {
        const token = parseCookies(ctx)['@web_front.token'];
        if (token && !config.headers.Authorization?.toString().endsWith(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                // Preserva a rota que o usuário tentava acessar (exceto raiz/login).
                const atual = window.location.pathname + window.location.search;
                const rota = atual && atual !== "/" && !atual.startsWith("/login")
                    ? atual
                    : undefined;
                signOut(rota);
            } else {
                return Promise.reject(new AuthTokenError())
            }
        }

        return Promise.reject(error);
    })
    return api;
}
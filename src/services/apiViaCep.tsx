import axios from 'axios';

function setupAPIClient(ctx = undefined){

    const api = axios.create({
       baseURL: 'https://viacep.com.br/ws',
    });
    return api;
}

export const apiViaCep = setupAPIClient();
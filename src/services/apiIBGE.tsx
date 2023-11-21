import axios from 'axios';

function setupAPIClient(ctx = undefined){

    const api = axios.create({
       baseURL: 'https://servicodados.ibge.gov.br/api/v1/localidades',
    });
    return api;
}

export const apiIbge = setupAPIClient();
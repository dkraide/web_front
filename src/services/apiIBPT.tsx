import axios from 'axios';

function setupAPIClient(ctx = undefined){

    const api = axios.create({
       baseURL: 'https://apidoni.ibpt.org.br/api/v1/produtos?token=dJ0DsiCr1SmqoiZ1enix5Urr8d7jKo3cDlnnQuiVzD0mjxv96gz2bitSqTrEUtnh&cnpj=34073667000136&uf=SP&ex=0&codigoInterno=11&descricao=Teste&unidadeMedida=UN&valor=1&gtin=NAO',
    });
    return api;
}

export const apiIBPT = setupAPIClient();
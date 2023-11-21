import axios from "axios";
import { toast } from "react-toastify";

export const fValidateNumer = (value) => {
    return !isNaN(value.replace(',', '.'));
}

export const fGetNumber = (value) =>{
    if(!value){
        return 0;
    }
    var res = Number(value.toString().replace(`,`, `.`));
    return isNaN(res) ? 0 : res;
}
export const nameof = <T>(name: keyof T) => name;

export const fGetOnlyNumber = (value) => {
    return value.replace(/\D/g, "");
}

export const getURLImagemMenu = (id, empresa) => {
    var _url = "http://krd.emartim.com.br/MenuDigital";
    if(id == undefined){
        return  `${_url}/${empresa}.jpg`;
    }
   return  `${_url}/${id}_${empresa}.jpg`;
}
export const  distance = (lat1, lon1, lat2, lon2, unit) => {
    const radlat1 = Math.PI * lat1/180;
    const radlat2 = Math.PI * lat2/180;
    const radlon1 = Math.PI * lon1/180;
    const radlon2 = Math.PI * lon2/180;
    const theta = lon1-lon2;
    const radtheta = Math.PI * theta/180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === "K") { dist = dist * 1.609344 }
    if (unit === "N") { dist = dist * 0.8684 }
    return dist;
}

export const paginationComponentOptions = {
    rowsPerPageText: 'Itens por Pagina',
    rangeSeparatorText: 'de',
    selectAllRowsItem: true,
    selectAllRowsItemText: 'Todos',
};
export const formatNumber = (n: number, money: boolean) => {
    return `${money ? 'R$' : ''} ${n.toFixed(2)} ${money? '' : '%'}`
}

export const  sendImage = async(obj: any) => {
    var res =  await axios.post(`https://krd.emartim.com.br/api/Cardapio/SendImageMenuDigital`, obj)
    .then(({data}) => {
        toast.success(`Imagem enviada com sucesso!`);
        return true;

    }).catch((err) => {
        toast.error(`Erro ao enviar imagem. ${err.response?.data || err.message}`);
        return false;
    });
   
    return res;

}


const blobToDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  
export const blobToBase64 = blob => blobToDataUrl(blob).then((text: string) => text.slice(text.indexOf(",") + 1));
  
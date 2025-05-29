import { api } from "@/services/apiClient";
import axios, { AxiosError, AxiosResponse } from "axios";
import { addHours } from "date-fns";
import FileSaver from "file-saver";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useWindowSize } from "rooks";
import XLSX from 'sheetjs-style';



export const fValidateNumer = (value) => {
    return !isNaN(value.replace(',', '.'));
}

export const fGetNumber = (value) => {
    if (!value) {
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
    if (id == undefined) {
        return `${_url}/${empresa}.jpg`;
    }
    return `${_url}/${id}_${empresa}.jpg`;
}
export const distance = (lat1, lon1, lat2, lon2, unit) => {
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const radlon1 = Math.PI * lon1 / 180;
    const radlon2 = Math.PI * lon2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
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
    return `${money ? 'R$' : ''} ${n.toFixed(2)} ${money ? '' : '%'}`
}

export const sendImage = async (files: any): Promise<string|undefined> => {
   
    var formData = new FormData();
    formData.append('image', files[0], files[0].name)
    setTimeout(() => {
    }, 500)
    return axios.post(`https://krdpic.krdsys.tech/pic/upload`, formData, { headers: { "Content-Type": 'multipart/form-data' } })
        .then(({ data }: AxiosResponse) => {
            console.log(data);
            return data.path;
        }).catch((err: AxiosError) => {
            console.log(err);
            return undefined;
        });
}
export const onFocus = (field, select?: boolean) => {
    document.getElementById(field)?.focus();
    if (select) {
        (document.getElementById(field) as HTMLInputElement)?.select()
    }
}


const blobToDataUrl = blob => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

export const isNullOrWhitespace = (input?: string) => {
    return !input || !input.trim();
}

export const blobToBase64 = blob => blobToDataUrl(blob).then((text: string) => text.slice(text.indexOf(",") + 1));

function getBase64(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        console.log(reader.result);
    };
    reader.onerror = function (error) {
        console.log('Error: ', error);
    };
}

export const isMobile = () => {
    const { innerWidth } = useWindowSize();
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
    console.log('innerWidth', innerWidth)

        if (!innerWidth) {
            return;
        }
        setMobile(innerWidth < 600);

    }, [innerWidth]);


    return mobile;

}


export const printHTML = (html: any) => {
    const blob: Blob = new Blob([html], { type: 'text/html' });
    const fileURL = URL.createObjectURL(blob);
    const iframe: HTMLIFrameElement = document.createElement('iframe');
    iframe.src = fileURL;
    iframe.setAttribute('hidden', 'true');
    document.body.appendChild(iframe);

    const printWin: Window = iframe.contentWindow!;
    console.log(printWin);

    printWin.print();
    printWin.onafterprint = () => { printWin.close(); document.body.removeChild(iframe); };

}

export const imprimirNFce = async (vendaId) => {
    await api.post(`/pdv/imprimir?vendaId=${vendaId}`)
        .then(({ data }: AxiosResponse) => {
            printHTML(data.html);

        }).catch((err: AxiosError) => {
            toast.error(`Erro`);
        })

}
export const random_rgba = () => {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',0.7)';
}
export const getMonths = (fromDate, toDate) => {
    console.log(fromDate);
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth();
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth();
    const months = [];

    for (let year = fromYear; year <= toYear; year++) {
        let monthNum = year === fromYear ? fromMonth : 0;
        const monthLimit = year === toYear ? toMonth : 11;

        for (; monthNum <= monthLimit; monthNum++) {
            let month = monthNum + 1;
            months.push(`${month}/${year}`);
        }
    }
    return months;
}

export const fGetDate = (date: string) => {
    var str = date.split(`-`);
    return new Date(Number(str[0]), Number(str[1]) - 1, Number(str[2]));
}

export type ACTION = '' | 'FINALIZAR' | 'LIMPAR';

export const fgetDate = (date) => {
    if (!date || date == '') {
        return new Date();
    }
    var r = new Date(date);
    r = addHours(r, 3);
    return r;
}

type ColumnData = {
    label: string
    key: string
}

export const ExportToExcel = (columns: ColumnData[], data: any[], fileName: string) => {
    var formattedArray = data.map((p) => {
        var object = {};
        columns.map((c) => {
            object[c.label] = p[c.key];
        });
        return object;
    });
    const fileType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const ws = XLSX.utils.json_to_sheet(formattedArray);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const d = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(d, fileName + ".xlsx");
}



export const GetCurrencyBRL = (value: number) => {
    if(isNaN(value) || value == undefined){
        return  (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    const valorFormatado = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return valorFormatado;
}


export const validateString = (value: string, minlenght?: number) => {
    if(!value){
        return false;
    }
    if(minlenght &&  value.length < minlenght){
        return false;
    }
    return true;
}

export const validateNumber = (value: any, min?: number, max?: number) => {
    var number = fGetNumber(value);
    if(!value){
        return false;
    }
    if(min &&  number < min){
        return false;
    }
    if(min && number> max){
    return false;
    }
    return true;
}


export const LucroPorcentagem = (venda, compra) => {
    if(venda <= compra){
        return 0
    }
    return (((venda - compra) / venda) * 100)
}

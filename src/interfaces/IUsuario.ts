import IUsuarioCaixa from "./IUsuarioCaixa"

export default interface IUsuario{
    id: string
    nome: string
    userName: string
    empresaSelecionada: number
    telefone?: string
    email?: string
    cpf?: string
    isPdv: boolean
    usuarioCaixa?: IUsuarioCaixa
    isContador: boolean
    // Ramo da empresa selecionada: controla quais telas/acoes aparecem no front.
    tipoSistema?: 'PADRAO' | 'RESTAURANTE' | 'LOJA_ROUPA'
}
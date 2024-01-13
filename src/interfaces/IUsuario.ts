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
}
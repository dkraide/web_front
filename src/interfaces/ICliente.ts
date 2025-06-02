export default interface ICliente{
 id: number
 lastChange: Date
 localCriacao: string
 idCliente: number
 cpf: string
 rg: string
 nome: string
 logradouro: string
 numero: string
 complemento: string
 bairro: string
 municipio: string
 uf: string
 cep: string
 telefone: string
 pontos: number
 status: boolean
 dataNascimento: Date
 codIBGE: string
 razaoSocial: string
 isConsumidorFinal: boolean
 isPessoaJuridica: boolean
 tipoIE: number
 empresaId: number
 needChange: boolean
 observacao: string
}
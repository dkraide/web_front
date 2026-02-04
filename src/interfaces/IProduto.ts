import IClasseMaterial from "./IClasseMaterial"
import ICodBarras from "./ICodBarras"
import IFornecedor from "./IFornecedor"
import IProdutoGrupo from "./IProdutoGrupo"
import IProdutoImagem from "./IProdutoImagem"
import IProdutoMateriaPrima from "./IProdutoMateriaPrima"
import IPromocao from "./IPromocao"
import ITamanho from "./ITamanho"
import ITributacao from "./ITributacao"

export default interface IProduto{
         idProduto: number
         nome: string
         id: number
         valorCompra: number
         cod: number
         valor: number
         quantidade: number
         status: boolean
         unidadeCompra: string
         tributacao: ITributacao
         idTributacao: number
         materiaPrimas: IProdutoMateriaPrima[]
         tamanhos: ITamanho[]
         fornecedores: IFornecedor[]
         grupoAdicionais: IProdutoGrupo[]
         codBarras: ICodBarras[]
         classeMaterial: IClasseMaterial
         idClasseMaterial: number
         quantidadeMinima: number
         empresaId: number
         classeMaterialId: number
         tributacaoId: number
         lastChange: Date
         localCriacao: string
         custoTotal: number
         codigoFornecedor: string
         multiplicadorFornecedor: number
         localPath: string
         getCustoMateriaPrima: boolean
         ultimaConferencia: Date
         valorUnitarioSemImposto: number
         aliqICMSFornecedor: number
         aliqICMSSTFornecedor: number
         aliqFCPFornecedor: number
         aliqMVAFornecedor: number
         tipo: string
         posicao: number
         visivelMenu: boolean
         promocoes: IPromocao[]
         descricao: string
         isConferencia: boolean
         imagem?: IProdutoImagem
         bloqueiaEstoque: boolean
         descricaoNutricional?: string
         calories?: string
         allergen?: string
         suitableDiet?: string
         isAlcoholic?: boolean
         serving?: number
         valorKeeta?: number
}
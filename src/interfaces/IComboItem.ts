import IClasseMaterial from "./IClasseMaterial"
import IProduto from "./IProduto"

export default interface IComboItem{
    idComboItem: number
    id: number
    idCombo: number
    produto: IProduto
    classeMaterial: IClasseMaterial
    valorUnitario: number
    quantidade: number
    comboId: number
    classeMaterialId: number
    produtoId: number
    idProduto: number
    idClasseMaterial: number
    empresaId: number
   }
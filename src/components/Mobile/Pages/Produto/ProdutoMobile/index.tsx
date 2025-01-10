import { AuthContext } from "@/contexts/AuthContext"
import IProduto from "@/interfaces/IProduto"
import { useContext, useEffect, useState } from "react"
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import _ from "lodash";
import { GetCurrencyBRL } from "@/utils/functions";
import { InputGroup } from "@/components/ui/InputGroup";
import CustomButton from "@/components/ui/Buttons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import FiltroProduto from "@/components/Modals/Produto/Mobile/FiltroProduto";
import ProdutoForm from "@/components/Modals/Produto";
import IUsuario from "@/interfaces/IUsuario";
import PictureBox from "@/components/ui/PictureBox";


type props = {
    produtos: IProduto[]
    user: IUsuario
    loadData: () => void
    handleNovoPrato: () => void
    handleNovaPizza: () => void
}

type groupped = {
    classe: IClasseMaterial
    produtos: IProduto[]
}

type searchProps = {
    str?: string
    classe?: IClasseMaterial
    status?: boolean
}

export default function ProdutoMobile({ produtos, user, loadData, handleNovaPizza, handleNovoPrato }: props) {
    const [list, setList] = useState<groupped[]>([])
    const [search, setSearch] = useState<searchProps>({ str: '', status: true })
    const [formSearch, setFormSearch] = useState(false)
    const [edit, setEdit] = useState(-1);
    useEffect(() => {
        if (!produtos) {
            return;
        }
        const groupedByClasseMaterial = _.groupBy(produtos, (produto) => produto.classeMaterialId);

        // Transforma o objeto agrupado em um array tipado
        var res = Object.entries(groupedByClasseMaterial).map(([classeId, produtos]) => {
            const classe = produtos[0].classeMaterial; // Assume que todos os produtos no grupo têm a mesma classe

            var p = _.filter(produtos, (item) => {
                if(search?.status && !item.status){
                    return false;
                }
                if(search?.status === false && item.status){
                    return false;
                }
                var text = `${item.cod} ${item.nome}`;
               
                return text.toUpperCase().includes(search?.str?.toUpperCase())
            })
            return { classe, produtos: p };
        });

        setList(res);
    }, [produtos, search.str])

    const GrupoItem = (grupo: groupped) => {
        if (!grupo || !grupo.produtos || grupo.produtos.length == 0) {
            return <></>
        }
        if (search?.classe && grupo.classe.id != search.classe.id) {
            return <></>
        }
        return (
            <div className={styles.grupo}>
                <h5>{grupo.classe?.nomeClasse}</h5>
                {grupo.produtos.map((item) => ProdutoItem(item))}
                <hr />
            </div>
        )
    }

    const Margem = (venda, compra) => {

        if(venda <= compra){
            return '0.00'
        }

        return (((venda - compra) / venda) * 100).toFixed(2)

    }

    const ProdutoItem = (produto: IProduto) => {
        return (
            <div className={styles.card} onClick={(v) => {
                setEdit(produto.id);
            }}>
                <div className={styles.pic}>
                    <PictureBox height={'90%'} size={'100%'} url={produto.localPath} />
                </div>
                <div className={styles.desc}>
                  
                    <span className={styles.nome}>{produto.cod} - {produto.nome}</span>
                    <span className={styles.estoque}>Estoque <br/><b>{produto.quantidade} {produto.unidadeCompra}</b></span>
                    <span className={produto.status ? styles.ativo : styles.inativo}>{produto.status ? 'ATIVO' : 'INATIVO'}</span>
                    <span className={styles.valores}>Venda <br/><b>{GetCurrencyBRL(produto.valor)}</b></span>
                    <span className={styles.valores}>Compra <br/><b>{GetCurrencyBRL(produto.valorCompra)}</b> </span>
                    <span className={styles.valores}>Margem(R$) <br/><b>{GetCurrencyBRL(produto.valor - produto.valorCompra)}</b> </span>
                    <span className={styles.valores}>Margem(%)  <br/><b>{Margem(produto.valor, produto.valorCompra)}</b> </span>
                </div>


            </div>
        )

    }



    return (
        <div className={styles.container}>
            <h3>Produtos</h3>
            <div className={styles.filtro}>
                <div style={{ width: '70%' }}>
                    <span>
                        <b>Filtros</b><br />
                        Classe: <b>{search?.classe ? search.classe.nomeClasse : 'Todos'}</b> Status: <b>{!!search?.status ? search.status ? 'ATIVOS' : 'INATIVOS' : 'Todos'}</b>
                    </span>
                </div>
                <div style={{ width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CustomButton onClick={() => { setFormSearch(true) }}><FontAwesomeIcon icon={faGear} /></CustomButton>
                </div>

            </div>
            <hr />
            <div className={styles.buttons}>
                <CustomButton style={{ width: '30%' }} typeButton={'dark'} onClick={() => { setEdit(0) }} >Novo Produto</CustomButton>
                <CustomButton style={{ width: '30%' }} typeButton={'dark'} onClick={handleNovaPizza}  >Nova Pizza</CustomButton>
                <CustomButton style={{ width: '30%' }} typeButton={'dark'} onClick={handleNovoPrato}   >Novo Prato</CustomButton>
            </div>
            <hr />
            <InputGroup title={'Pesquisar'} value={search?.str} onChange={({ currentTarget }) => { setSearch({ ...search, str: currentTarget.value }) }} />
            {list?.map((item) => GrupoItem(item))}
            {formSearch && <FiltroProduto searchProps={search} isOpen={formSearch} setClose={(v) => {
                setFormSearch(false);
                setSearch(v ? v : { str: '' })
            }} />}

            {(edit >= 0) && <ProdutoForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
        </div>
    )
}
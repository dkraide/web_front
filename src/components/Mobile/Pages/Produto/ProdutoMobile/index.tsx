import { AuthContext } from "@/contexts/AuthContext"
import IProduto from "@/interfaces/IProduto"
import { useContext, useEffect, useState } from "react"
import styles from './styles.module.scss';
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import _ from "lodash";
import { GetCurrencyBRL } from "@/utils/functions";
import { InputGroup } from "@/components/ui/InputGroup";


type props = {
    produtos: IProduto[]
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

export default function ProdutoMobile({ produtos }: props) {
    const [list, setList] = useState<groupped[]>([])
    const { getUser } = useContext(AuthContext);
    const [search, setSearch] = useState<searchProps>({ str: '' })
    useEffect(() => {
        if (!produtos) {
            return;
        }
        const groupedByClasseMaterial = _.groupBy(produtos, (produto) => produto.classeMaterialId);

        // Transforma o objeto agrupado em um array tipado
        var res = Object.entries(groupedByClasseMaterial).map(([classeId, produtos]) => {
            const classe = produtos[0].classeMaterial; // Assume que todos os produtos no grupo têm a mesma classe

            var p = _.filter(produtos, (item) => {
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
        return (
            <div className={styles.grupo}>
                <h5>{grupo.classe?.nomeClasse}</h5>
                {grupo.produtos.map((item) => ProdutoItem(item))}
                <hr />
            </div>
        )
    }

    const ProdutoItem = (produto: IProduto) => {
        return (
            <div className={styles.card}>
                <span className={styles.cod}>{produto.cod}</span>
                <span className={styles.nome}>{produto.nome}</span>
                <span className={produto.status ? styles.ativo : styles.inativo}>{produto.status ? 'ATIVO' : 'INATIVO'}</span>
                <span className={styles.estoque}>{produto.quantidade} {produto.unidadeCompra}</span>
                <span className={styles.estoque}>{GetCurrencyBRL(produto.valorCompra)} </span>
                <span className={styles.estoque}>{GetCurrencyBRL(produto.valor)}</span>


            </div>
        )

    }



    return (
        <div className={styles.container}>
            <h3>Produtos</h3>
            <div className={styles.filtro}>
                <span>Classe: <b>{search?.classe ? search.classe.nomeClasse : 'Todos' }</b><br/>
                      Status: <b>{!!search?.status ? search.status ? 'ATIVOS': 'INATIVOS': 'Todos'}</b> </span>

            </div>
            <hr/>
            <InputGroup title={'Pesquisar'} value={search?.str} onChange={({ currentTarget }) => { setSearch({ ...search, str: currentTarget.value }) }} />
            {list?.map((item) => GrupoItem(item))}
        </div>
    )
}
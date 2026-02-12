import { useContext, useEffect, useState } from 'react';
import styles from './styles..module.scss';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import { AuthContext } from '@/contexts/AuthContext';
import { Form } from 'react-bootstrap';
import { GetCurrencyBRL, sendImage } from '@/utils/functions';
import { EditarCardapioForm } from '@/components/Modals/Produto/EditarCardapioForm';
import { toast } from 'react-toastify';
import { InputGroup } from '@/components/ui/InputGroup';
import Loading from '@/components/Loading';
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm';
import IUsuario from '@/interfaces/IUsuario';


export default function Cardapio() {
    const [classes, setClasses] = useState<IClasseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [editProd, setEditProd] = useState<IProduto>();
    const [editCategoria, setEditCategoria] = useState<IClasseMaterial>();
    const [selectedClasse, setSelectedClasse] = useState<IClasseMaterial>();
    const [user, setUser] = useState<IUsuario>();
    const { getUser } = useContext(AuthContext);

    const loadData = async () => {
        if (!loading) {
            setLoading(true);
        }
        setSelectedClasse(undefined);
        var u = await getUser();
        if(!user){
            setUser(u);
        }
        await api.get(`/produto/${u.empresaSelecionada}/ListByClasse`).then(({ data }) => {
            setClasses(data);
        }).catch((err) => {
            console.log(err)
        })


        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, []);
    useEffect(() => {
        if (classes && !selectedClasse) {
            setSelectedClasse(classes[0])
        }
    }, [classes])



    function setImage(p: IProduto) {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = 'image/png, image/jpeg';
        input.click();
        input.onchange = async (e: Event) => {
            setTimeout(() => {
            }, 500)
            const target = e.target as HTMLInputElement;
            const files = target.files as FileList;
            setLoading(true);
            var str = await sendImage(files);
            if (str) {
                p.localPath = str;
                await api.put(`/Produto/UpdateProduct`, p).then(({ data }) => {
                    toast.success('Produto atualizado com sucessso!');
                    loadData();
                }).catch((err) => {
                    toast.error(`Erro ao atualizar o produto`);
                });
            } else {
                toast.error(`Erro ao enviar imagem`);
            }
            setLoading(false);
        }
    }

    async function onToggle(isProduto, id, status) {
        var res = await onConfirm(status ? 'false' : 'true', id, 'VISIVELMENU', isProduto);
        if (!res) {
            return;
        }
        loadData();
    }

    async function onConfirm(value: string, id: number, column: string, isProduto: boolean) {
        let url = `/${isProduto ? 'Produto' : 'ClasseMaterial'}/MenuUpdateData?id=${id}
         &column=${column}&value=${value}`;
        return await api.put(url)
            .then(({ data }) => {
                toast.success('Status atualizado com sucesso');
                loadData();
                return true;
            }).catch((err) => {
                toast.error(`Erro ao atualizar status. ${err.response?.data || err.message}`);
                return false;
            });
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <Loading />

            </div>
        )
    }
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Configuração de cardápio para delivery</h3>
            </div>
            <div className={styles.menu}>
                <div className={styles.categorias}>
                    <Categorias onEdit={setEditCategoria} onToggle={onToggle} classes={classes} selected={selectedClasse?.id} handleSelected={setSelectedClasse} />
                </div>
                <div className={styles.items}>
                    {
                        selectedClasse && (
                            <Produtos produtos={selectedClasse?.produtos} onToggleProduto={onToggle} setImage={setImage} onEditProd={setEditProd} />
                        )
                    }

                </div>

            </div>
            {/* <div className={styles.body}>
                <Categorias onToggleProduto={onToggleProduto} setImage={setImage} classes={filtered()} onEditProd={setEditProd} />
            </div> */}
            {editProd && (
                <EditarCardapioForm
                    item={editProd}
                    setClose={(res) => {
                        if (res) {
                            loadData();
                        }
                        setEditProd(undefined);
                    }}
                />
            )}
            {editCategoria && (
                <ClasseForm isOpen={true} classeId={editCategoria.id} setClose={(res?: boolean) => {
                    if (res) {
                        loadData();
                    }
                    setEditCategoria(undefined);
                }} user={user} />
            )}
        </div>
    )
}

const Categorias = ({ classes, selected, handleSelected, onToggle, onEdit }: {onEdit: (classe: IClasseMaterial) => void, onToggle: (isProduto, id, status) => void, classes: IClasseMaterial[], selected?: number, handleSelected: (classe) => void }) => {

    return (
        <div>
            <b>Categorias</b>
            {classes?.map((classe) => <Categoria onEdit={onEdit} onToggle={onToggle} handleSelected={handleSelected} key={classe.id} classe={classe} selected={classe.id == selected} />)}
        </div>
    )

}
const Categoria = ({ classe, selected, handleSelected, onToggle, onEdit }: {onEdit: (classe: IClasseMaterial) => void,  onToggle: (isProduto, id, status) => void, classe: IClasseMaterial, selected: boolean, handleSelected: (classe) => void }) => {
    return (
        <div onClick={() => { handleSelected(classe) }} className={[styles.categoria, selected ? styles.categoriaSelecionada : ''].join(' ')}>
            <div className={styles.status}>
                <Form style={{ marginLeft: 'auto' }}>
                    <Form.Switch
                        onChange={() => { onToggle(false, classe.id, !classe.visivelMenu) }}
                        isValid={classe.visivelMenu}
                        checked={classe.visivelMenu}
                    />
                </Form>
            </div>
            <span onClick={() => {onEdit(classe)}} className={styles.name}>{classe.nomeClasse}</span>
        </div>
    )

}

const Produtos = ({ produtos, onEditProd, setImage, onToggleProduto }: { onToggleProduto: (isProduto, id, status) => void, setImage: (prod: IProduto) => void, produtos: IProduto[], onEditProd: (prod: IProduto) => void }) => {
    return (
        <div className={styles.produtos}>
            {produtos?.map((produto) => <Produto onToggleProduto={onToggleProduto} setImage={setImage} onEditProd={onEditProd} produto={produto} key={produto.id} />)}
        </div>
    )

}
const Produto = ({ produto, onEditProd, setImage, onToggleProduto }: { onToggleProduto: (isProduto, id, status) => void, setImage: (prod: IProduto) => void, produto: IProduto, onEditProd: (prod: IProduto) => void }) => {
    return (
        <div className={styles.produto}>
            <div className={styles.produtoInfo}>
                <img
                    onClick={() => {
                        setImage(produto);
                    }}
                    alt="Imagem do produto"
                    src={produto.localPath}
                    onError={(e) => {
                        e.currentTarget.src = '/comida.png';
                    }}
                />
                <span className={styles.prodName} onClick={() => onEditProd(produto)}>{produto.nome}</span>
                <Form style={{ marginLeft: 'auto' }}>
                    <Form.Switch
                        onChange={() => { onToggleProduto(true, produto.id, produto.visivelMenu) }}
                        isValid={produto.visivelMenu}
                        checked={produto.visivelMenu}
                    />
                </Form>
            </div>
            <div className={styles.informations}>
                <div className={styles.information}>
                    <label>{GetCurrencyBRL(produto.valor)}</label>
                    <span>Menu Digital</span>
                </div>
                <div className={styles.information}>
                    <label>{GetCurrencyBRL(produto.valorKeeta)}</label>
                    <span>Keeta</span>
                </div>
                <div className={styles.information}>
                    <label>{produto.descricaoNutricional ?? 'N/D'}</label>
                    <span>Informação Nutricional</span>
                </div>

                <div className={styles.information}>
                    <label>{produto.serving}</label>
                    <span>Serve quantas pessoas?</span>
                </div>

                <div className={styles.information}>
                    <label>{produto.isAlcoholic ? 'SIM' : 'NÃO'}</label>
                    <span>Alcoólico?</span>
                </div>

                <div className={styles.information}>
                    <label>{produto.suitableDiet ?? 'N/D'}</label>
                    <span>Tags de Dieta</span>
                </div>

                <div className={styles.information}>
                    <label>{produto.allergen ?? 'N/D'}</label>
                    <span>Alérgicos</span>
                </div>

                <div className={styles.information}>
                    <label>{produto.calories ?? 'N/D'}</label>
                    <span>Calorias</span>
                </div>
            </div>
        </div>
    )
}
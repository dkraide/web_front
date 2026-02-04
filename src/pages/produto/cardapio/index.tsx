import { useContext, useEffect, useState } from 'react';
import styles from './styles..module.scss';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import { api } from '@/services/apiClient';
import IProduto from '@/interfaces/IProduto';
import { AuthContext } from '@/contexts/AuthContext';
import { Form, ToggleButton } from 'react-bootstrap';
import { GetCurrencyBRL, sendImage } from '@/utils/functions';
import { EditarCardapioForm } from '@/components/Modals/Produto/EditarCardapioForm';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import EditMerchantForm from '@/components/Modals/Cardapio/EditMerchantForm';
import EditServiceForm from '@/components/Modals/Cardapio/EditServiceForm';


export default function Cardapio() {
    const [classes, setClasses] = useState<IClasseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [editProd, setEditProd] = useState<IProduto>();
    const [editLoja, setEditLoja] = useState<boolean>(false);
    const [editHorario, setEditHorario] = useState<boolean>(false);
    const { getUser } = useContext(AuthContext);

    const loadData = async () => {
        if (!loading) {
            setLoading(true);
        }
        var user = await getUser();
        await api.get(`/produto/${user.empresaSelecionada}/ListByClasse`).then(({ data }) => {
            setClasses(data);
        }).catch((err) => {
            console.log(err)
        })


        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, []);

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

    async function onToggleProduto(isProduto, id, status) {
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Configuração de cardápio para delivery</h3>
            </div>
            <hr />
            <div className={styles.buttons}>
                <CustomButton onClick={() => setEditLoja(true)}>Configuração Loja</CustomButton>
                <CustomButton onClick={() => setEditHorario(true)}>Configuração Horarios</CustomButton>

            </div>
            <hr />
            <div className={styles.body}>
                <Categorias onToggleProduto={onToggleProduto} setImage={setImage} classes={classes} onEditProd={setEditProd} />
            </div>
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
            {editLoja && (
                <EditMerchantForm
                    setClose={(r) => {
                        setEditLoja(false);
                    }}
                />
            )}
            {editHorario && (
                <EditServiceForm
                    setClose={(r) => {
                        setEditHorario(false);
                    }}
                />
            )}
        </div>
    )
}

const Categorias = ({ classes, onEditProd, setImage, onToggleProduto }: { onToggleProduto: (isProduto, id, status) => void, setImage: (prod: IProduto) => void, classes: IClasseMaterial[], onEditProd: (prod: IProduto) => void }) => {

    return (
        <div className={styles.categorias}>
            {classes?.map((classe) => <Categoria onToggleProduto={onToggleProduto} setImage={setImage} key={classe.id} classe={classe} onEditProd={onEditProd} />)}
        </div>
    )

}
const Categoria = ({ classe, onEditProd, setImage, onToggleProduto }: { onToggleProduto: (isProduto, id, status) => void, setImage: (prod: IProduto) => void, classe: IClasseMaterial, onEditProd: (prod: IProduto) => void }) => {
    return (
        <div className={styles.categoria}>
            <div className={styles.categoriaInfo}>
                <img
                    alt="Imagem da categoria"
                    src={classe.localPath}
                    onError={(e) => {
                        e.currentTarget.src = '/comida.png';
                    }}
                />
                <span>{classe.nomeClasse}</span>
                <Form style={{ marginLeft: 'auto' }}>
                    <Form.Switch
                        onChange={() => { onToggleProduto(false, classe.id, classe.visivelMenu) }}
                        isValid={classe.visivelMenu}
                        checked={classe.visivelMenu}
                    />
                </Form>
            </div>
            <Produtos onToggleProduto={onToggleProduto} setImage={setImage} produtos={classe.produtos} onEditProd={onEditProd} />

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
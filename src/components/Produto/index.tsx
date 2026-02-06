import { Tab, Tabs } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';
import IProdutoGrupo from '@/interfaces/IProdutoGrupo';
import CustomButton from '@/components/ui/Buttons';
import NovoGrupo from '@/components/Modals/Produto/prato/NovoGrupo';
import VinculeMateriaPrima from '@/components/Modals/MateriaPrima/VinculaProduto';
import { productSchema } from '@/schemas/ProductSchema';
import { useProdutoData } from './hooks/useProdutoData';
import { useCodigoBarras } from './hooks/useCodigoBarras';
import { useMateriaPrima } from './hooks/useMateriaPrima';
import { useGrupoAdicionais } from './hooks/useGrupoAdicionais';
import { useImageUpload } from './hooks/useImageUpload';
import ProdutoDetalhes from './components/ProdutoDetalhes';
import ProdutoMenuDigital from './components/ProdutoMenuDigital';
import ProdutoGrupos from './components/ProdutoGrupos';
import styles from './styles.module.scss';

export default function ProdutoItem() {
    const { produto, setProduto, user, loading, setLoading, loadCod } = useProdutoData();
    const [modalGrupo, setModalGrupo] = useState(false);
    const [indexGrupo, setIndexGrupo] = useState<number>(-1);
    const [tipoCal, setTipoCal] = useState('Cal');
    const [modalMp, setModalMp] = useState(false);

    const { imagePreview, handleImageChange, uploadImagemAsync, hasNewImage } = useImageUpload();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            valor: 0,
            unidadeCompra: 'UN',
            status: true,
            isAlcoholic: false,
            bloqueiaEstoque: false,
            quantidade: 0,
            quantidadeMinima: 0,
            valorCompra: 0,
            valorKeeta: 0,
            multiplicadorFornecedor: 1,
            posicao: 0,
            nome: '',
        },
    });

    const { addCodigo, removeCodigo } = useCodigoBarras(produto, setProduto);
    const { addMp, removeMateriaPrima } = useMateriaPrima(produto, setProduto, user);
    const { addOrUpdateGrupo, removeGrupo } = useGrupoAdicionais(produto, setProduto);

    useEffect(() => {
        if(!produto || loading){
            return;
        }
        if (produto?.id) {
            let cal = '', tipoCal = '';
            if(produto.calories?.includes(' ')){
                var cls = produto.calories.split(' ');
                cal = cls[0];
                setTipoCal(cls[1]);
            }
            reset({...produto, calories: cal});
        } else {
            loadCod().then((c) => {
                setValue('cod', c.toString());
            });
        }
    }, [produto]);

    const onSubmit = async (data) => {
        setLoading(true);

        const updatedProduto = {
            ...produto,
            aliqFCPFornecedor: 0,
            aliqICMSFornecedor: 0,
            aliqICMSSTFornecedor: 0,
            aliqMVAFornecedor: 0,
            bloqueiaEstoque: data.bloqueiaEstoque,
            calories: `${data.calories} ${tipoCal}`,
            classeMaterialId: data.classeMaterialId,
            cod: data.cod,
            codigoFornecedor: data.codigoFornecedor,
            descricao: data.descricao,
            descricaoNutricional: data.descricaoNutricional,
            idClasseMaterial: data.idClasseMaterial,
            idTributacao: data.idTributacao,
            isAlcoholic: data.isAlcoholic,
            isConferencia: data.isConferencia,
            multiplicadorFornecedor: data.multiplicadorFornecedor,
            nome: data.nome,
            posicao: data.posicao,
            quantidadeMinima: data.quantidadeMinima,
            serving: data.serving,
            status: data.status,
            tributacaoId: data.tributacaoId,
            unidadeCompra: data.unidadeCompra,
            valor: data.valor,
            valorCompra: data.valorCompra,
            valorKeeta: data.valorKeeta,
            visivelMenu: data.visivelMenu,
        };

        try {
            let produtoId = produto.id;

            // Criar ou atualizar produto
            if (!produto.id || produto.id <= 0) {
                updatedProduto.tipo = 'SIMPLES';
                updatedProduto.status = true;
                updatedProduto.empresaId = user.empresaSelecionada;
                const { data: novoProduto } = await api.post(`/v2/Produto?empresaId=${user.empresaSelecionada}`, updatedProduto);
                produtoId = novoProduto.id;
                toast.success('Produto criado com sucesso!');
            } else {
                await api.put(`/v2/Produto?empresaId=${user.empresaSelecionada}`, updatedProduto);
                toast.success('Produto atualizado com sucesso!');
            }

            // Upload da imagem se houver uma nova
            if (hasNewImage && produtoId) {
                const newLocalPath = await uploadImagemAsync(produtoId);
                if (newLocalPath) {
                    // Atualiza o produto com o novo localPath
                    setProduto({ ...updatedProduto, id: produtoId, localPath: newLocalPath });
                }
            }
        } catch (err) {
            toast.error('Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    const handleNewGrupo = (response?: IProdutoGrupo) => {
        setModalGrupo(false);
        if (response) {
            response.idProduto = produto.idProduto;
            response.produtoId = produto.id;
            addOrUpdateGrupo(response, indexGrupo);
        }
    };

    const handleAddCodigo = (codigoBarras: string) => {
        if (addCodigo(codigoBarras)) {
            setValue('codigoBarras', '');
        }
    };

    if (!produto) {
        return <></>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <h3>Cadastro de produto</h3>
                <Tabs defaultActiveKey="produto" id="uncontrolled-tab-example" variant="underline" justify={false} fill>
                    <Tab eventKey="produto" title="Detalhes">
                        <ProdutoDetalhes
                            control={control}
                            errors={errors}
                            register={register}
                            setValue={setValue}
                            produto={produto}
                            imagePreview={imagePreview}
                            onImageChange={handleImageChange}
                            onAddCodigo={handleAddCodigo}
                            onRemoveCodigo={removeCodigo}
                        />
                    </Tab>

                    <Tab eventKey="menuDigital" title="Menu Digital">
                        <ProdutoMenuDigital
                            control={control}
                            errors={errors}
                            produto={produto}
                            setProduto={setProduto}
                            tipoCal={tipoCal}
                            setTipoCal={setTipoCal}
                        />
                    </Tab>

                    <Tab className={styles.tab} eventKey="grupos" title="Grupos de Adicionais">
                        <ProdutoGrupos
                            materiaPrimas={produto.materiaPrimas}
                            grupoAdicionais={produto.grupoAdicionais}
                            onAddMateriaPrima={() => setModalMp(true)}
                            onRemoveMateriaPrima={removeMateriaPrima}
                            onAddGrupo={() => {
                                setIndexGrupo(-1);
                                setModalGrupo(true);
                            }}
                            onEditGrupo={(index) => {
                                setIndexGrupo(index);
                                setModalGrupo(true);
                            }}
                            onDeleteGrupo={removeGrupo}
                        />
                    </Tab>
                </Tabs>
            </div>

            <div style={{ width: '100%', marginTop: 20 }} className={styles.buttons}>
                <CustomButton disabled={loading} loading={loading} onClick={handleSubmit(onSubmit)}>
                    Cadastrar
                </CustomButton>
            </div>

            {modalMp && (
                <VinculeMateriaPrima
                    user={user}
                    isOpen={modalMp}
                    setClose={(res) => {
                        if (res) {
                            addMp(res.mp, res.qntd, res.opcional);
                        }
                        setModalMp(false);
                    }}
                />
            )}

            {modalGrupo && (
                <NovoGrupo
                    isOpen={modalGrupo}
                    grupoEditado={indexGrupo < 0 ? undefined : produto.grupoAdicionais[indexGrupo]}
                    setClose={handleNewGrupo}
                />
            )}
        </div>
    );
}
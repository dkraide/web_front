import CustomButton from "@/components/ui/Buttons";
import styles from './styles.module.scss';
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IProduto from "@/interfaces/IProduto";
import SelectTributacao from "@/components/Selects/SelectTributacao";
import KRDBaseModal from "../../KRDBaseModal";
import TributacaoForm from "../../Tributacao/TributacaoForm";
import IUsuario from "@/interfaces/IUsuario";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import ClasseForm from "../../ClasseMaterial/CreateEditForm";
import { fGetNumber } from "@/utils/functions";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { isMobile } from "react-device-detect";
import { InputForm } from "@/components/ui/InputGroup";
import SelectStatus from "@/components/Selects/SelectStatus";
import ICodBarras from "@/interfaces/ICodBarras";
import { api } from "@/services/apiClient";

type novoProdutoProps = {
  isOpen: boolean;
  setClose: (res?) => void;
  user: IUsuario;
}
type formProps = {
  formData: IProduto;
  setFormData: (data: IProduto) => void;
}
export default function NovoProdutoForm({ isOpen, setClose, user }: novoProdutoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IProduto>({} as IProduto);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setFormData({ ...formData, status: true });
    setValue('unidadeCompra', 'UN');
    setValue('valor', '0');
    setValue('valorCompra', '0');
    setCurrentStep(0);
    getNexCode();
  }, [])
  const {
    register,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors } } =
    useForm();


  const getNexCode = async () => {
    await api.get(`/produto/nextcod?empresaid=${user.empresaSelecionada}`).then(res => {
      if (res.data) {
        console.log(res.data);
        setFormData({ ...formData, cod: res.data });
        setValue('cod', res.data);
      }
    }).catch(errr => {
      console.log(errr);
    });
  }

  const FormDados = () => {

    const CodigoItem = (codigo: ICodBarras) => {
      const handleRemove = () => {
        const codigos = formData.codBarras?.filter(c => c.codigo !== codigo.codigo);
        setFormData({ ...formData, codBarras: codigos });
        toast.success('Código removido com sucesso!');
      }
      return (
        <div key={codigo.codigo} className={styles.codigoItem}>
          <span>{codigo.codigo}</span>
          <button onClick={handleRemove}>X</button>
        </div>
      )
    }
    const handleAddCodigo = () => {
      if (!formData.codBarras) {
        formData.codBarras = [];
      }
      const codigo = getValues('codigoBarras');
      const codigoExistente = formData.codBarras?.find(c => c.codigo === codigo);
      if (!codigo || codigo.trim() === '') {
        toast.error('Informe um código de barras válido.');
        return;
      }
      formData.codBarras = [...formData.codBarras, { codigo } as ICodBarras];
      setFormData({ ...formData });
      setValue('codigoBarras', '');
      toast.success('Código adicionado com sucesso!');
    }

    return (
      <div className={styles.containerTributacao}>
        <h4>Dados do Produto</h4>
        <span>📝 Aqui você insere as informações básicas do produto, como nome, código, descrição e unidade de medida. <br /><br /></span>
        <InputForm defaultValue={formData.cod} width={'10%'} title={'Cod'} errors={errors} inputName={"cod"} register={register} />
        <SelectStatus width={'15%'} selected={formData.status} setSelected={(v) => { setFormData({ ...formData, status: v }) }} />
        <InputForm placeholder={'Nome do Produto'} defaultValue={formData.nome} width={isMobile ? '100%' : '75%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
        <InputForm defaultValue={formData.unidadeCompra} maxLength={3} width={'15%'} title={'UN Medida'} errors={errors} inputName={"unidadeCompra"} register={register} />
        <InputForm defaultValue={formData.valorCompra} width={'15%'} title={'Preço de Custo (R$)'} errors={errors} inputName={"valorCompra"} register={register} />
        <InputForm defaultValue={formData.valor} width={'15%'} title={'Valor de Venda (R$)'} errors={errors} inputName={"valor"} register={register} />
        <InputForm defaultValue={formData.quantidadeMinima} width={'15%'} title={'Estoque Minimo'} errors={errors} inputName={"quantidadeMinima"} register={register} />
        <InputForm defaultValue={formData.quantidade} width={'15%'} title={'Estoque Atual'} errors={errors} inputName={"quantidade"} register={register} />
        <div style={{ width: '100%' }}>
          <hr />
        </div>
        <h4>Codigo de Barras</h4>
        <span>
          🔍 O código de barras facilita a identificação e o controle do produto no ponto de venda. Você pode vincular quantos códigos desejar a um mesmo produto. <br />
          👉 Exemplo: informe o código no campo <strong>"Código de Barras"</strong> e clique no botão <strong>Adicionar</strong> para vinculá-lo ao produto.
        </span>
        {formData.codBarras && formData.codBarras.length > 0 && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '10px', width: '100%' }}>
            {formData.codBarras.map(c => CodigoItem(c))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '10px', width: '100%' }}>
          <InputForm defaultValue={''} width={isMobile ? '70%' : '20%'} title={'Código de Barras'} errors={errors} inputName={"codigoBarras"} register={register} />
          <CustomButton onClick={handleAddCodigo} style={{ marginBottom: 17, width: '150px', height: 40 }}>Adicionar</CustomButton>
        </div>

      </div>
    )
  }
  const FormOutrasInfos = () => {
    return (
      <div className={styles.containerTributacao}>
        <h4>Fornecedor</h4>
        <span>
          🏢 Vincular um fornecedor ao produto ajuda no controle de estoque e facilita futuras reposições. <br /><br />

          📌 Exemplo: o <strong>Código do Fornecedor</strong> representa o código que vem na Nota Fiscal, permitindo alimentar automaticamente o estoque. <br /><br />

          🔢 <strong>Multiplicador do Fornecedor:</strong> este campo é útil para itens que você compra em caixa e vende em unidade. <br />
          Ex.: 1 CX de picolé vem com 28 unidades, então o campo multiplicador seria 28. Assim, ao lançar uma caixa, entram automaticamente 28 unidades no estoque.
        </span>
        <InputForm defaultValue={formData.codigoFornecedor} width={'15%'} title={'Cod. Fornecedor'} errors={errors} inputName={"codigoFornecedor"} register={register} />
        <InputForm defaultValue={formData.multiplicadorFornecedor} width={'15%'} title={'Mult. Fornecedorr'} errors={errors} inputName={"multiplicadorFornecedor"} register={register} />
      </div>
    )
  }

  const steps = [
    <FormGrupoTributacao key="tributacao" formData={formData} setFormData={setFormData} />,
    <FormDados />,
    <FormOutrasInfos />
  ];

  const validarTela = () => {
    let validado = false;
    switch (currentStep) {
      case 0:
        validado = validarGrupoTributacao();
        break;
      case 1:
        validado = validarDadosProduto();
        break;
      case 2:
        validado = true;

    }

    if (validado) {
      setCurrentStep((p) => p + 1);
    }
  }

  const validarGrupoTributacao = (): boolean => {
    const tributacaoId = fGetNumber(formData.tributacaoId);
    const classeMaterialId = fGetNumber(formData.classeMaterialId);
    if (tributacaoId === undefined || tributacaoId == null || tributacaoId <= 0) {
      toast.error('Selecione um grupo de tributação para continuar.');
      return false;
    }
    if (classeMaterialId === undefined || classeMaterialId == null || classeMaterialId <= 0) {
      toast.error('Selecione um grupo de material para continuar.');
      return false;
    }
    return true;
  }

  const validarDadosProduto = (): boolean => {
    const nome = getValues('nome');
    if (!nome || nome.trim() === '' || nome.length < 3) {
      toast.error('O nome do produto é obrigatório.');
      return false;
    }
    const valorVenda = fGetNumber(getValues('valor'));
    if (!valorVenda || valorVenda <= 0) {
      toast.error('Informe um valor de venda maior que zero.');
      return false;
    }
    const codigo = fGetNumber(getValues('cod'));
    if (!codigo || codigo <= 0) {
      toast.error('Informe um codigo maior que zero.');
      return false;
    }




    return true;
  }


  const onSubmit = async (data) => {
    console.log('submit', data);
    setLoading(true);
    formData.empresaId = user.empresaSelecionada;
    formData.cod = data.cod;
    formData.nome = data.nome;
    formData.unidadeCompra = data.unidadeCompra;
    formData.valorCompra = fGetNumber(data.valorCompra);
    formData.valor = fGetNumber(data.valor);
    formData.quantidadeMinima = fGetNumber(data.quantidadeMinima);
    formData.quantidade = fGetNumber(data.quantidade);
    formData.codigoFornecedor = data.codigoFornecedor;
    formData.multiplicadorFornecedor = fGetNumber(data.multiplicadorFornecedor);
    await api.post(`/v2/produto?empresaId=${user.empresaSelecionada}`, formData).then(({data}) => {
      toast.success(`Sucesso!`);
      setClose(true);
    }).catch(err => {
       console.log(`erro`, err);
    })



    setLoading(false);
  }



  if (formData.tributacaoId === -1) {
    return (
      <TributacaoForm
        id={0}
        user={user}
        isOpen={formData.tributacaoId === -1}
        setClose={(tributacao) => {
          setFormData({ ...formData, tributacaoId: 0 })

        }}
      />
    )

  }
  if (formData.classeMaterialId === -1) {
    return (
      <ClasseForm
        classeId={0}
        user={user}
        isOpen={formData.classeMaterialId === -1}
        setClose={(tributacao) => {
          setFormData({ ...formData, classeMaterialId: 0 })

        }}
      />
    )

  }



  return (
    <KRDBaseModal width={90} height={80} isOpen={isOpen} setClose={setClose} title="Novo Produto">
      <div className={styles.container}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.buttons}>
        {currentStep > 0 && (
          <CustomButton onClick={() => setCurrentStep((p) => p - 1)}>Voltar</CustomButton>
        )}
        {currentStep < steps.length - 1 && (
          <CustomButton onClick={validarTela}>Continuar</CustomButton>
        )}
        {currentStep === steps.length - 1 && <CustomButton loading={loading} onClick={() => {
          handleSubmit(onSubmit)()}}>Salvar</CustomButton>}
      </div>
    </KRDBaseModal>
  );
}

const FormGrupoTributacao = ({ formData, setFormData }: formProps) => {

  return (
    <div className={styles.containerTributacao}>
      <h4>Grupo de Tributação</h4>
      <span>
        💰 Grupos de tributações são essenciais para o preenchimento do cupom fiscal. <br /><br />
        ⚙️ É aqui que você configura informações como <strong>NCM</strong>, <strong>CFOP</strong> e outros campos obrigatórios.
      </span>
      <SelectTributacao width={'90%'} selected={formData.tributacaoId} setSelected={(t) => {
        setFormData({ ...formData, tributacaoId: t.id, idTributacao: t.idTributacao, tributacao: t })
      }} />
      <CustomButton onClick={() => {
        setFormData({ ...formData, tributacaoId: -1 })
      }}>Novo</CustomButton>
      <div style={{ width: '100%' }}>
        <hr />

      </div>
      <h4>Grupo Material</h4>
      <span>
        📦 Organizar seus produtos em grupos facilita relatórios e ajustes em massa. <br /><br />
        👉 Por exemplo: você pode criar um grupo chamado <strong>"Picolé de Leite"</strong>, adicionar todos os sabores a ele e, depois, realizar alterações em todos os itens do grupo de uma só vez.
      </span>
      <SelectClasseMaterial width={'90%'} selected={formData.classeMaterialId} setSelected={(t) => {
        setFormData({ ...formData, classeMaterialId: t.id, idClasseMaterial: t.idClasseMaterial, classeMaterial: t })
      }} />
      <CustomButton onClick={() => {
        setFormData({ ...formData, classeMaterialId: -1 })
      }}>Novo</CustomButton>
    </div>
  )
}




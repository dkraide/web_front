import { useState } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import KRDInput from "@/components/ui/KRDInput";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import type { IFoodCategoriaResumo } from "@/interfaces/ifoodCatalog";
import { externalCodeClasse } from "@/interfaces/ifoodCatalog";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import styles from "./ModalCriarCategoria.module.scss";

interface Props {
  isOpen: boolean;
  empresaId: number;
  catalogId: string;
  /** Total de categorias existentes — usado como index de ordenação. */
  sequenceAtual: number;
  onClose: () => void;
  onCriada: (categoria: IFoodCategoriaResumo) => void;
}

type CategoriaForm = { name: string };

export default function ModalCriarCategoria({
  isOpen, empresaId, catalogId,
  sequenceAtual, onClose, onCriada,
}: Props) {
  const [classeSelecionada, setClasseSelecionada] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<CategoriaForm>();

  function handleClose() {
    reset();
    setClasseSelecionada(0);
    setErro(null);
    onClose();
  }

  async function onSubmit(form: CategoriaForm) {
    setSalvando(true);
    setErro(null);
    try {
      // 1. Cria a categoria
      const result = await ifoodCatalogService.criarCategoria(
        empresaId, catalogId,
        {
          name:     form.name,
          status:   "AVAILABLE",
          template: "DEFAULT",
          index:    sequenceAtual,
        }
      );

      if (!result.sucesso) {
        setErro(result.erro);
        return;
      }

      // 2. Se selecionou classe, vincula via editarCategoria com externalCode
      if (classeSelecionada > 0) {
        const externalCode = externalCodeClasse(classeSelecionada);
        await ifoodCatalogService.editarCategoria(
          empresaId, catalogId, result.dados.id,
          { externalCode }
        );
        onCriada({ ...result.dados, externalCode });
      } else {
        onCriada(result.dados);
      }

      handleClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      title="Nova categoria"
      setClose={handleClose}
      width="460px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Informações</p>
          <KRDInput
            label="Nome da categoria"
            name="name"
            control={control}
            placeholder="Ex: Lanches, Bebidas, Sobremesas..."
          />
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Vínculo KRD System</p>
          <p className={styles.sectionDesc}>
            Opcional. Vincule uma classe de material para integração de estoque.
          </p>
          <SelectClasseMaterial
            empresaId={empresaId}
            selected={classeSelecionada}
            setSelected={(c?: IClasseMaterial) => setClasseSelecionada(c?.id ?? 0)}
            width="100%"
          />
        </div>

        {erro && <span className={styles.erro}>{erro}</span>}

        <div className={styles.actions}>
          <CustomButton typeButton="outline-main" type="button" onClick={handleClose}>
            Cancelar
          </CustomButton>
          <CustomButton typeButton="main" type="submit" loading={salvando}>
            Criar categoria
          </CustomButton>
        </div>

      </form>
    </BaseModal>
  );
}
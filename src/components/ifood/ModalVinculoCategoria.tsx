import { useState } from "react";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial";
import type { IFoodCategoriaDetalhe } from "@/interfaces/ifoodCatalog";
import { externalCodeClasse, parseVinculo } from "@/interfaces/ifoodCatalog";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import styles from "./ModalVinculo.module.scss";

interface Props {
  isOpen: boolean;
  empresaId: number;
  categoria: IFoodCategoriaDetalhe | null;
  onClose: () => void;
  onVinculado: (categoria: IFoodCategoriaDetalhe, externalCode: string | null) => void;
}

export default function ModalVinculoCategoria({
  isOpen, empresaId, categoria, onClose, onVinculado,
}: Props) {
  const vinculoAtual = parseVinculo(categoria?.externalCode);
  const [classeSelecionada, setClasseSelecionada] = useState<number>(
    vinculoAtual?.tipo === "classe" ? vinculoAtual.id : 0
  );

  function salvar() {
    if (!categoria) return;
    // classeSelecionada === 0 significa "sem vínculo"
    onVinculado(
      categoria,
      classeSelecionada > 0 ? externalCodeClasse(classeSelecionada) : null
    );
    onClose();
  }
  return (
    <BaseModal
      isOpen={isOpen}
      title={`Vincular categoria — ${categoria?.name}`}
      setClose={onClose}
      width="440px"
    >
      <div className={styles.form}>
        <p className={styles.desc}>
          Selecione a classe de material do KRD System correspondente a esta categoria.
        </p>

        {vinculoAtual?.tipo === "classe" && (
          <div className={styles.vinculoAtual}>
            <span className={styles.vinculoLabel}>Vínculo atual</span>
            <span className={styles.vinculoId}>Classe #{vinculoAtual.id}</span>
            <button className={styles.removerBtn}
              onClick={() => { onVinculado(categoria!, null); onClose(); }}>
              Remover
            </button>
          </div>
        )}

        <SelectClasseMaterial
          empresaId={empresaId}
          selected={classeSelecionada}
          setSelected={(c?: IClasseMaterial) => setClasseSelecionada(c?.id ?? 0)}
          width="100%"
        />

        <div className={styles.actions}>
          <CustomButton typeButton="outline-main" onClick={onClose}>
            Cancelar
          </CustomButton>
          <CustomButton
            typeButton="main"
            disabled={classeSelecionada === 0}
            onClick={salvar}
          >
            Vincular
          </CustomButton>
        </div>
      </div>
    </BaseModal>
  );
}
import { useState } from "react";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import SelectProduto from "@/components/Selects/SelectProduto";
import { IFoodItemResumo, externalCodeProduto, parseVinculo } from "@/interfaces/ifoodCatalog";
import IProduto from "@/interfaces/IProduto";
import styles from "./ModalVinculo.module.scss";

interface Props {
  isOpen: boolean;
  empresaId: number;
  item: IFoodItemResumo | null;
  onClose: () => void;
  onVinculado: (itemId: string, externalCode: string) => void;
}

export default function ModalVinculoItem({
  isOpen, empresaId, item, onClose, onVinculado
}: Props) {
  const vinculoAtual = parseVinculo(item?.externalCode);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number>(
    vinculoAtual?.tipo === "produto" ? vinculoAtual.id : 0
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!item || produtoSelecionado === 0) return;
    setSalvando(true);
    setErro(null);
    try {
      const externalCode = externalCodeProduto(produtoSelecionado);
      onVinculado(item.id, externalCode);
      onClose();
    } catch {
      setErro("Erro ao vincular.");
    } finally {
      setSalvando(false);
    }
  }

  function removerVinculo() {
    if (!item) return;
    onVinculado(item.id, "");
    onClose();
  }

  return (
    <BaseModal
      isOpen={isOpen}
      title={`Vincular item — ${item?.name}`}
      setClose={onClose}
      width="440px"
    >
      <div className={styles.form}>
        <p className={styles.desc}>
          Selecione o produto do KRD System correspondente a este item do iFood.
          O vínculo é usado para baixar estoque automaticamente ao receber pedidos.
        </p>

        {vinculoAtual && vinculoAtual.tipo === "produto" && (
          <div className={styles.vinculoAtual}>
            <span className={styles.vinculoLabel}>Vínculo atual</span>
            <span className={styles.vinculoId}>Produto #{vinculoAtual.id}</span>
            <button className={styles.removerBtn} onClick={removerVinculo}>
              Remover
            </button>
          </div>
        )}

        <SelectProduto
          empresaId={empresaId}
          selected={produtoSelecionado}
          setSelected={(p: IProduto) => setProdutoSelecionado(p.id)}
          width="100%"
        />

        {erro && <span className={styles.erro}>{erro}</span>}

        <div className={styles.actions}>
          <CustomButton typeButton="outline-main" onClick={onClose}>
            Cancelar
          </CustomButton>
          <CustomButton
            typeButton="main"
            loading={salvando}
            disabled={produtoSelecionado === 0}
            onClick={salvar}
          >
            Vincular
          </CustomButton>
        </div>
      </div>
    </BaseModal>
  );
}
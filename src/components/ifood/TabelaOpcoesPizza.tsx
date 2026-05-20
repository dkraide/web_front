import { FiTrash2, FiPlus } from "react-icons/fi";
import styles from "./TabelaOpcoesPizza.module.scss";

export interface OpcaoPizzaForm {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  externalCode: string;
  optionId?: string;
  productId?: string;
}

interface Props {
  label: string;           // "Massa" | "Borda"
  placeholder: string;     // "Ex: Tradicional" | "Ex: Cheddar"
  itens: OpcaoPizzaForm[];
  onChange: (itens: OpcaoPizzaForm[]) => void;
}

export function TabelaOpcoesPizza({ label, placeholder, itens, onChange }: Props) {
  function add() {
    onChange([
      ...itens,
      { id: crypto.randomUUID(), nome: "", preco: 0, ativo: true, externalCode: "" },
    ]);
  }

  function update(id: string, patch: Partial<OpcaoPizzaForm>) {
    onChange(itens.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }

  function remove(id: string) {
    onChange(itens.filter(i => i.id !== id));
  }

  return (
    <div className={styles.tabelaWrapper}>
      <div className={styles.tabelaHeader}>
        <span className={styles.colNome}>{label}</span>
        <span className={styles.colPreco}>Preço</span>
        <span className={styles.colStatus}>Status de vendas</span>
        <span className={styles.colCod}>Cód. PDV</span>
        <span className={styles.colAcao} />
      </div>

      {itens.map(item => (
        <div key={item.id} className={styles.tabelaRow}>
          <div className={styles.colNome}>
            <span className={styles.dragHandle}>⠿</span>
            <input
              className={styles.tabelaInput}
              placeholder={placeholder}
              value={item.nome}
              onChange={e => update(item.id, { nome: e.target.value })}
            />
          </div>

          <div className={styles.colPreco}>
            <div className={styles.precoInput}>
              <span className={styles.precoPrefix}>R$</span>
              <input
                type="number"
                step="0.01"
                min={0}
                className={styles.tabelaInputPreco}
                value={item.preco === 0 ? "" : item.preco}
                placeholder="0,00"
                onChange={e => update(item.id, { preco: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className={styles.colStatus}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={item.ativo}
                onChange={e => update(item.id, { ativo: e.target.checked })}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.colCod}>
            <input
              className={styles.tabelaInputCod}
              placeholder="000"
              value={item.externalCode}
              onChange={e => update(item.id, { externalCode: e.target.value })}
            />
          </div>

          <div className={styles.colAcao}>
            <button
              className={styles.btnRemover}
              onClick={() => remove(item.id)}
              title={`Remover ${label.toLowerCase()}`}
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button className={styles.btnAdicionar} onClick={add}>
        <FiPlus size={13} />
        Adicionar {label.toLowerCase()}
      </button>
    </div>
  );
}
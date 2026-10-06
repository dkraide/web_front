import { ReactNode, useId, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { sendImage } from '@/utils/functions';
import styles from './styles.module.scss';

export function Campo({ label, dica, children }: { label: string; dica?: string; children: ReactNode }) {
    return (
        <div className={styles.campo}>
            <label>{label}</label>
            {children}
            {dica && <small>{dica}</small>}
        </div>
    );
}

export function Grupo({ titulo, children, aberto = true }: { titulo: string; children: ReactNode; aberto?: boolean }) {
    const [open, setOpen] = useState(aberto);
    return (
        <section className={styles.grupo}>
            <header onClick={() => setOpen(!open)}>
                <b>{titulo}</b>
                <span>{open ? '−' : '+'}</span>
            </header>
            {open && <div className={styles.grupoCorpo}>{children}</div>}
        </section>
    );
}

export const Linha = ({ children }: { children: ReactNode }) => <div className={styles.linha}>{children}</div>;

export function Txt({ label, value, onChange, dica, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; dica?: string; placeholder?: string;
}) {
    return (
        <Campo label={label} dica={dica}>
            <Form.Control size="sm" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        </Campo>
    );
}

export function Area({ label, value, onChange, dica, rows = 4 }: {
    label: string; value: string; onChange: (v: string) => void; dica?: string; rows?: number;
}) {
    return (
        <Campo label={label} dica={dica}>
            <Form.Control as="textarea" rows={rows} size="sm" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </Campo>
    );
}

export function Num({ label, value, onChange, min, max, step, dica }: {
    label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; dica?: string;
}) {
    return (
        <Campo label={label} dica={dica}>
            <Form.Control
                size="sm" type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step}
                onChange={(e) => {
                    let n = parseFloat(e.target.value);
                    if (!Number.isFinite(n)) n = 0;
                    if (min !== undefined) n = Math.max(min, n);
                    if (max !== undefined) n = Math.min(max, n);
                    onChange(n);
                }}
            />
        </Campo>
    );
}

export function Sel<T extends string | number>({ label, value, onChange, opcoes, dica }: {
    label: string; value: T; onChange: (v: T) => void; opcoes: { valor: T; rotulo: string }[]; dica?: string;
}) {
    return (
        <Campo label={label} dica={dica}>
            <Form.Select
                size="sm" value={String(value)}
                onChange={(e) => {
                    const op = opcoes.find((o) => String(o.valor) === e.target.value);
                    if (op) onChange(op.valor);
                }}
            >
                {opcoes.map((o) => <option key={String(o.valor)} value={String(o.valor)}>{o.rotulo}</option>)}
            </Form.Select>
        </Campo>
    );
}

export function Sw({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    const id = useId();
    return (
        <div className={styles.switch}>
            <Form.Check type="switch" id={id} label={label} checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        </div>
    );
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function Cor({ label, value, onChange, vazioHerda }: {
    label: string; value: string; onChange: (v: string) => void; vazioHerda?: boolean;
}) {
    return (
        <Campo label={label}>
            <div className={styles.cor}>
                <input type="color" value={HEX.test(value) ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
                <Form.Control size="sm" value={value ?? ''} placeholder={vazioHerda ? 'herda do tema' : '#000000'} onChange={(e) => onChange(e.target.value)} />
                {vazioHerda && value && <button type="button" onClick={() => onChange('')} title="Voltar a herdar do tema">×</button>}
            </div>
        </Campo>
    );
}

export function Img({ label, value, onChange, dica }: { label: string; value: string; onChange: (v: string) => void; dica?: string }) {
    const [enviando, setEnviando] = useState(false);

    function escolher() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg, image/webp';
        input.onchange = async (e: Event) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files?.length) return;
            setEnviando(true);
            const path = await sendImage(files);
            setEnviando(false);
            if (path) onChange(path);
            else toast.error('Não foi possível enviar a imagem.');
        };
        input.click();
    }

    return (
        <Campo label={label} dica={dica}>
            <div className={styles.img}>
                <div className={styles.imgPreview} onClick={escolher}>
                    {enviando ? <Spinner size="sm" /> : value ? <img src={value} alt="" /> : <span>Clique para enviar</span>}
                </div>
                <div className={styles.imgAcoes}>
                    <button type="button" onClick={escolher}>Trocar</button>
                    {value && <button type="button" onClick={() => onChange('')}>Remover</button>}
                </div>
            </div>
        </Campo>
    );
}

// Lista editavel generica: adicionar, remover e reordenar itens.
export function Lista<T extends { id: string }>({ itens, onChange, novo, titulo, render, max }: {
    itens: T[];
    onChange: (v: T[]) => void;
    novo: () => T;
    titulo: (item: T, i: number) => string;
    render: (item: T, set: (patch: Partial<T>) => void, i: number) => ReactNode;
    max?: number;
}) {
    const mover = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= itens.length) return;
        const c = [...itens];
        [c[i], c[j]] = [c[j], c[i]];
        onChange(c);
    };
    return (
        <div className={styles.lista}>
            {itens.map((item, i) => (
                <ItemLista
                    key={item.id}
                    titulo={titulo(item, i)}
                    onUp={i > 0 ? () => mover(i, -1) : undefined}
                    onDown={i < itens.length - 1 ? () => mover(i, 1) : undefined}
                    onRemove={() => onChange(itens.filter((_, k) => k !== i))}
                >
                    {render(item, (patch) => onChange(itens.map((x, k) => (k === i ? { ...x, ...patch } : x))), i)}
                </ItemLista>
            ))}
            {(max === undefined || itens.length < max) && (
                <button type="button" className={styles.add} onClick={() => onChange([...itens, novo()])}>+ Adicionar</button>
            )}
        </div>
    );
}

export function ItemLista({ titulo, children, onUp, onDown, onRemove, extra }: {
    titulo: string; children: ReactNode; onUp?: () => void; onDown?: () => void; onRemove?: () => void; extra?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles.item}>
            <div className={styles.itemTopo}>
                <button type="button" className={styles.itemTitulo} onClick={() => setOpen(!open)}>
                    {open ? '▾' : '▸'} {titulo || '(sem título)'}
                </button>
                <div className={styles.itemBotoes}>
                    {extra}
                    <button type="button" disabled={!onUp} onClick={onUp} title="Subir">↑</button>
                    <button type="button" disabled={!onDown} onClick={onDown} title="Descer">↓</button>
                    {onRemove && <button type="button" onClick={onRemove} title="Remover" className={styles.perigo}>✕</button>}
                </div>
            </div>
            {open && <div className={styles.itemCorpo}>{children}</div>}
        </div>
    );
}

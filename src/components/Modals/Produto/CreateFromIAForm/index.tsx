// CreateFromIAForm.tsx
import styles from './styles.module.scss';
import BaseModal from '../../Base/Index';
import { useState } from 'react';
import { api } from '@/services/apiClient';
import IUsuario from '@/interfaces/IUsuario';

type Props = {
    setClose: (res?: number) => void;
    user: IUsuario;
}

type Estado = 'input' | 'loading' | 'sucesso';

const EXEMPLOS = [
    'Coca Cola 2lt',
    'Picolé chocolate venda 2 reais custo 1 real',
    'Água mineral 500ml caixa com 12',
    'Arroz tipo 1 5kg preço 25 custo 18',
    'Camiseta masculina P M G branca estoque 50',
];

const STEPS = [
    'Identificando nome e categoria',
    'Preenchendo preços e unidades',
    'Salvando produto',
];

export default function CreateFromIAForm({ setClose, user }: Props) {
    const [nome, setNome] = useState('');
    const [estado, setEstado] = useState<Estado>('input');
    const [stepAtual, setStepAtual] = useState(-1);
    const [erro, setErro] = useState('');

    const handleSubmit = async () => {
        if (!nome.trim()) {
            setErro('Descreva o produto antes de continuar.');
            return;
        }

        setErro('');
        setEstado('loading');
        setStepAtual(0);

        const timers = [
            setTimeout(() => setStepAtual(1), 800),
            setTimeout(() => setStepAtual(2), 1800),
        ];

        try {
            const { data } = await api.post(
                `/v2/Produto/${user.empresaSelecionada}/CreateFromIA`,
                { message: nome }
            );

            timers.forEach(clearTimeout);
            setStepAtual(3);

            if (data?.id) {
                setTimeout(() => setEstado('sucesso'), 400);
                setTimeout(() => setClose(data.id), 1800);
            }
        } catch {
            timers.forEach(clearTimeout);
            setStepAtual(-1);
            setEstado('input');
            setErro('Não foi possível criar o produto. Tente novamente.');
        }
    };

    return (
        <BaseModal setClose={setClose} isOpen={true} title="Cadastrar produto com I.A">
            <div className={styles.wrapper}>

                {/* ── Estado: input ── */}
                {estado === 'input' && (
                    <>
                        <label className={styles.label}>Descrição do produto</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Ex: Coca Cola 2lt gelada"
                            value={nome}
                            onChange={e => { setNome(e.target.value); setErro(''); }}
                            rows={3}
                        />
                        {erro && <p className={styles.erro}>{erro}</p>}

                        <p className={styles.exTitle}>Exemplos — clique para usar:</p>
                        <div className={styles.exemplos}>
                            {EXEMPLOS.map(ex => (
                                <button
                                    key={ex}
                                    className={styles.chip}
                                    onClick={() => setNome(ex)}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>

                        <div className={styles.dica}>
                            <InfoIcon />
                            <span>Inclua nome, tamanho, preço e custo quando souber. A I.A preenche o restante automaticamente.</span>
                        </div>

                        <div className={styles.acoes}>
                            <button className={styles.btnSecundario} onClick={() => setClose()}>
                                Cancelar
                            </button>
                            <button className={styles.btnPrimario} onClick={handleSubmit}>
                                <SparkIcon /> Criar com I.A
                            </button>
                        </div>
                    </>
                )}

                {/* ── Estado: loading ── */}
                {estado === 'loading' && (
                    <div className={styles.loadingWrapper}>
                        <div className={styles.spinner} />
                        <p className={styles.loadingMsg}>
                            {stepAtual === 0 && 'Analisando descrição...'}
                            {stepAtual === 1 && 'Interpretando campos...'}
                            {stepAtual >= 2 && 'Salvando produto...'}
                        </p>
                        <p className={styles.loadingSub}>Isso pode levar alguns segundos</p>
                        <div className={styles.steps}>
                            {STEPS.map((label, i) => (
                                <div key={label} className={styles.step}>
                                    <span className={`${styles.stepDot} ${stepAtual > i ? styles.stepOk : ''}`}>
                                        {stepAtual > i ? '✓' : i + 1}
                                    </span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Estado: sucesso ── */}
                {estado === 'sucesso' && (
                    <div className={styles.sucessoWrapper}>
                        <div className={styles.checkCircle}>
                            <CheckIcon />
                        </div>
                        <p className={styles.sucessoTitulo}>Produto criado!</p>
                        <p className={styles.sucessoSub}>Redirecionando para a edição...</p>
                    </div>
                )}

            </div>
        </BaseModal>
    );
}

// ── Ícones inline simples ──
const SparkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
    </svg>
);
const InfoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);
const CheckIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
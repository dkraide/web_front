import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faXmark, faPaperPlane, faMicrophone, faImage } from '@fortawesome/free-solid-svg-icons';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import styles from './styles.module.scss';

type Mensagem = { autor: 'usuario' | 'edna'; texto: string; imagens?: string[] };
type ImagemSelecionada = { preview: string };

const MAX_IMAGENS = 3;

// Detecta caminhos "/relatorio/algo" na resposta da Edna e transforma em
// botão clicável — a IA já foi instruída a sempre incluir a URL quando
// sugere uma aba do módulo completo de Relatórios.
function renderMensagemComLinks(texto: string) {
    const partes = texto.split(/(\/relatorio\/[a-zA-Z0-9]+)/g);
    return partes.map((parte, i) =>
        parte.startsWith('/relatorio/') ? (
            <Link key={i} href={parte} className={styles.linkRelatorio}>
                📊 Abrir relatório completo
            </Link>
        ) : (
            <span key={i}>{parte}</span>
        )
    );
}

interface EdnaChatProps {
    empresaId: number;
}

export default function EdnaChat({ empresaId }: EdnaChatProps) {
    const [aberto, setAberto] = useState(false);
    const [mensagens, setMensagens] = useState<Mensagem[]>([
        { autor: 'edna', texto: 'Oi! Sou a Edina. Pode pedir um relatório ou uma alteração, por exemplo: "vendas dos últimos 15 dias".' },
    ]);
    const [input, setInput] = useState('');
    const [imagens, setImagens] = useState<ImagemSelecionada[]>([]);
    const [enviando, setEnviando] = useState(false);
    const [gravando, setGravando] = useState(false);
    const [transcrevendo, setTranscrevendo] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const fimDaListaRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (aberto) fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens, aberto, gravando, transcrevendo]);

    // Redimensiona no navegador antes de mandar — fotos de celular vêm
    // grandes, isso evita estourar o limite de tamanho da requisição e
    // deixa o envio mais rápido, sem perda perceptível pro que a IA precisa ler.
    function redimensionarImagem(file: File, larguraMaxima = 1600): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new window.Image();
                img.onload = () => {
                    const escala = Math.min(1, larguraMaxima / img.width);
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width * escala;
                    canvas.height = img.height * escala;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.82));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function selecionarImagens(e: React.ChangeEvent<HTMLInputElement>) {
        const espacoLivre = MAX_IMAGENS - imagens.length;
        const arquivos = Array.from(e.target.files ?? []).slice(0, espacoLivre);
        e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois

        if (arquivos.length === 0) return;

        try {
            const novas = await Promise.all(arquivos.map(async (file) => ({ preview: await redimensionarImagem(file) })));
            setImagens((atual) => [...atual, ...novas].slice(0, MAX_IMAGENS));
        } catch {
            toast.error('Não consegui processar essa imagem.');
        }
    }

    function removerImagem(index: number) {
        setImagens((atual) => atual.filter((_, i) => i !== index));
    }

    // Envia um texto já pronto (digitado ou transcrito), com ou sem imagens
    // anexadas — função única reaproveitada pelos dois fluxos de entrada.
    async function enviarTexto(texto: string, imagensParaEnviar: string[] = []) {
        if (!texto.trim() || !empresaId) return;

        setMensagens((atual) => [...atual, { autor: 'usuario', texto, imagens: imagensParaEnviar }]);
        setEnviando(true);

        await api.post(
            `/edna/chat`,
            { message: texto, conversationId, imagens: imagensParaEnviar.length ? imagensParaEnviar : undefined },
            { params: { empresaId } }
        )
            .then(({ data }: AxiosResponse) => {
                setConversationId(data.conversationId);
                setMensagens((atual) => [...atual, { autor: 'edna', texto: data.reply }]);
            })
            .catch((err: AxiosError) => {
                if (err.response?.status === 429) {
                    toast.warn('Limite diário de mensagens atingido. Volta amanhã!');
                    setMensagens((atual) => [...atual, { autor: 'edna', texto: 'Atingimos o limite de mensagens de hoje. Volta amanhã que te ajudo de novo!' }]);
                    return;
                }
                toast.error(`Erro ao falar com a Edina. ${err.response?.data || err.message}`);
                setMensagens((atual) => [...atual, { autor: 'edna', texto: 'Não consegui processar agora, tenta de novo em instantes.' }]);
            })
            .finally(() => setEnviando(false));
    }

    async function enviarMensagem() {
        const texto = input.trim();
        if (!texto || enviando) return;

        const imagensParaEnviar = imagens.map((i) => i.preview);
        setInput('');
        setImagens([]);
        await enviarTexto(texto, imagensParaEnviar);
    }

    async function alternarGravacao() {
        if (gravando) {
            mediaRecorderRef.current?.stop();
            setGravando(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                await transcreverEEnviar(blob);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setGravando(true);
        } catch {
            toast.error('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
        }
    }

    // Transcreve e já manda direto (com as imagens anexadas, se houver) —
    // igual a um áudio de WhatsApp, sem passar pelo campo de texto.
    async function transcreverEEnviar(blob: Blob) {
        setTranscrevendo(true);

        const extensao = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        const formData = new FormData();
        formData.append('audio', blob, `gravacao.${extensao}`);

        await api.post('/edna/transcrever', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(async ({ data }: AxiosResponse) => {
                if (!data.texto) {
                    toast.warn('Não entendi o áudio, tenta falar de novo.');
                    return;
                }
                const imagensParaEnviar = imagens.map((i) => i.preview);
                setImagens([]);
                await enviarTexto(data.texto, imagensParaEnviar);
            })
            .catch((err: AxiosError) => {
                toast.error(`Não consegui transcrever o áudio. ${err.response?.data || err.message}`);
            })
            .finally(() => setTranscrevendo(false));
    }

    return (
        <div className={styles.wrapper}>
            {aberto && (
                <div className={styles.painel}>
                    <div className={styles.cabecalho}>
                        <span>Edina</span>
                        <a onClick={() => setAberto(false)}><FontAwesomeIcon icon={faXmark} /></a>
                    </div>

                    <div className={styles.mensagens}>
                        {mensagens.map((m, i) => (
                            <div key={i} className={m.autor === 'usuario' ? styles.bolhaUsuario : styles.bolhaEdna}>
                                {m.imagens && m.imagens.length > 0 && (
                                    <div className={styles.miniaturasEnviadas}>
                                        {m.imagens.map((src, j) => (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img key={j} src={src} alt="Imagem enviada" className={styles.miniatura} />
                                        ))}
                                    </div>
                                )}
                                {m.texto && (m.autor === 'edna' ? renderMensagemComLinks(m.texto) : m.texto)}
                            </div>
                        ))}
                        {enviando && !transcrevendo && <div className={styles.digitando}>digitando…</div>}
                        <div ref={fimDaListaRef} />
                    </div>

                    {gravando ? (
                        <div className={styles.gravacaoCentral}>
                            <a className={styles.botaoGravandoGrande} onClick={alternarGravacao} title="Toque para parar e enviar">
                                <FontAwesomeIcon icon={faMicrophone} size="lg" />
                            </a>
                            <span className={styles.textoGravando}>Gravando... toque pra enviar</span>
                        </div>
                    ) : transcrevendo ? (
                        <div className={styles.gravacaoCentral}>
                            <div className={styles.spinner} />
                            <span className={styles.textoGravando}>Transcrevendo áudio...</span>
                        </div>
                    ) : (
                        <>
                            {imagens.length > 0 && (
                                <div className={styles.previaImagens}>
                                    {imagens.map((img, i) => (
                                        <div key={i} className={styles.previaImagemItem}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img.preview} alt={`Imagem ${i + 1}`} />
                                            <a onClick={() => removerImagem(i)} className={styles.removerImagem}>
                                                <FontAwesomeIcon icon={faXmark} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form className={styles.rodape} onSubmit={(e) => { e.preventDefault(); enviarMensagem(); }}>
                                <a className={styles.botaoSecundario} title="Gravar áudio" onClick={alternarGravacao}>
                                    <FontAwesomeIcon icon={faMicrophone} />
                                </a>
                                <a
                                    className={imagens.length >= MAX_IMAGENS ? styles.botaoDesabilitado : styles.botaoSecundario}
                                    title={imagens.length >= MAX_IMAGENS ? 'Máximo de 3 imagens' : 'Anexar imagem'}
                                    onClick={() => imagens.length < MAX_IMAGENS && fileInputRef.current?.click()}
                                >
                                    <FontAwesomeIcon icon={faImage} />
                                </a>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={selecionarImagens}
                                />
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Pergunte algo pra Edina..."
                                    className={styles.input}
                                    disabled={enviando}
                                />
                                <button type="submit" disabled={enviando || !input.trim()} className={styles.botaoEnviar}>
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            <a className={styles.botaoFlutuante} onClick={() => setAberto(!aberto)}>
                <FontAwesomeIcon icon={aberto ? faXmark : faCommentDots} size="lg" />
            </a>
        </div>
    );
}
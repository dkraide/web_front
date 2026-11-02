import { useRef } from 'react';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';

interface ImagemUploadProps {
    /** Imagem atual (localPath da API). */
    src?: string | null
    /** Endpoint que recebe o multipart `file`, ex.: `/Premio/12/UploadImagem`. */
    uploadUrl: string
    onUploaded: () => void
    size?: number
}

/** Miniatura clicável: ao clicar abre o seletor e envia a imagem escolhida para `uploadUrl`. */
export default function ImagemUpload({ src, uploadUrl, onUploaded, size = 85 }: ImagemUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    async function enviar(file: File) {
        const formData = new FormData();
        formData.append('file', file, file.name);
        try {
            await api.post(uploadUrl, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onUploaded();
        } catch {
            toast.error('Erro ao tentar salvar imagem.');
        }
    }

    return (
        <div style={{ cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
            <input
                ref={inputRef}
                type="file"
                accept="image/png, image/jpeg"
                hidden
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) enviar(file);
                    e.target.value = '';
                }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                style={{ width: size, height: size, padding: 5 }}
                src={src ?? '/nopic.png'}
                alt=""
                onError={e => { e.currentTarget.src = '/nopic.png' }}
            />
        </div>
    );
}

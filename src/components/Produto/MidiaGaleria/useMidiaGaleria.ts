import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'react-toastify'
import { api } from '@/services/apiClient'
import IProdutoMidia, { TipoMidia } from '@/interfaces/IProdutoMidia'

// Midia da galeria. Existente = tem id + preview (URL); nova = tem file + preview blob.
export type MidiaItem = {
    key: string
    id?: number
    tipo: TipoMidia
    preview: string
    file?: File
}

export const LIMITE_MIDIAS = 10
const LIMITE_VIDEO_MB = 200

export const tipoDoArquivo = (file: File): TipoMidia => {
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) return 'GIF'
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name)) return 'VIDEO'
    return 'IMAGEM'
}

// Estado da galeria de midias (N por produto). Arquivos novos ficam em blob e so
// sobem em salvar(); remocoes de midias existentes tambem so valem no salvar().
export function useMidiaGaleria() {
    const [midias, setMidias] = useState<MidiaItem[]>([])
    const [removidas, setRemovidas] = useState<number[]>([])

    const carregar = async (produtoId: number) => {
        const { data } = await api.get<IProdutoMidia[]>(`/Produto/${produtoId}/midia`)
        setMidias((data ?? []).map(m => ({
            key: `srv-${m.id}`,
            id: m.id,
            tipo: m.tipo ?? 'IMAGEM',
            preview: m.localPath,
        })))
        setRemovidas([])
    }

    const adicionar = (files: File[]) => {
        const novas: MidiaItem[] = []
        for (const file of files) {
            if (midias.length + novas.length >= LIMITE_MIDIAS) {
                toast.warn(`Máximo de ${LIMITE_MIDIAS} mídias.`)
                break
            }
            const tipo = tipoDoArquivo(file)
            if (tipo === 'VIDEO' && file.size > LIMITE_VIDEO_MB * 1024 * 1024) {
                toast.error(`Vídeo "${file.name}" maior que ${LIMITE_VIDEO_MB}MB.`)
                continue
            }
            novas.push({ key: uuidv4(), tipo, file, preview: URL.createObjectURL(file) })
        }
        if (novas.length) setMidias(prev => [...prev, ...novas])
    }

    const remover = (m: MidiaItem) => {
        if (m.id) setRemovidas(prev => [...prev, m.id!])
        if (m.file) URL.revokeObjectURL(m.preview)
        setMidias(prev => prev.filter(x => x.key !== m.key))
    }

    // Move uma midia uma posicao para a esquerda (-1) ou direita (+1).
    const mover = (key: string, delta: -1 | 1) => {
        setMidias(prev => {
            const i = prev.findIndex(x => x.key === key)
            const j = i + delta
            if (i < 0 || j < 0 || j >= prev.length) return prev
            const copia = [...prev]
            const tmp = copia[i]
            copia[i] = copia[j]
            copia[j] = tmp
            return copia
        })
    }

    // Aplica no servidor: apaga as removidas, sobe as novas e grava a ordem final.
    const salvar = async (produtoId: number) => {
        for (const id of removidas) {
            await api.delete(`/Produto/${produtoId}/midia/${id}`).catch(() => null)
        }
        const ids: number[] = []
        for (const m of midias) {
            if (m.id) { ids.push(m.id); continue }
            const form = new FormData()
            form.append('arquivo', m.file!, m.file!.name)
            const { data } = await api.post<IProdutoMidia>(`/Produto/${produtoId}/midia`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            ids.push(data.id)
        }
        if (ids.length > 1) await api.put(`/Produto/${produtoId}/midia/ordem`, ids)
    }

    return { midias, adicionar, remover, mover, carregar, salvar }
}

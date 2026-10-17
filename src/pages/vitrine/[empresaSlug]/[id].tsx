import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Vitrine from '@/components/Setor/Vitrine'
import { ISetorPublico } from '@/interfaces/ISetorPublico'
import { api } from '@/services/apiClient'

// Somente em desenvolvimento: /vitrine/demo/1 mostra uma vitrine de exemplo sem depender da API.
const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/900`
const demo: ISetorPublico = {
    nome: 'Vitrine de Verão',
    descricao: 'Peças selecionadas da estação.',
    loja: { nome: 'Loja Demo', descricao: 'Moda feminina', endereco: 'Rua das Flores, 100 • Centro - São Paulo', telefone: '(11) 99999-9999', whatsapp: '11999999999', instagram: '@lojademo' },
    produtos: [
        { produtoId: 1, nome: 'Vestido Floral Midi', descricao: 'Tecido leve, ideal para dias quentes.\nDisponível em P, M e G.', valor: 189.9, midias: [{ url: img('v1'), tipo: 'IMAGEM' }, { url: img('v1b'), tipo: 'IMAGEM' }, { url: img('v1c'), tipo: 'GIF' }] },
        { produtoId: 2, nome: 'Camisa Linho Branca', descricao: '100% linho.', valor: 139, midias: [{ url: img('c1'), tipo: 'IMAGEM' }] },
        { produtoId: 3, nome: 'Short Jeans', descricao: null, valor: 99.9, midias: [{ url: img('s1'), tipo: 'IMAGEM' }] },
        { produtoId: 4, nome: 'Bolsa de Palha', descricao: 'Artesanal.', valor: 249.5, midias: [{ url: img('b1'), tipo: 'IMAGEM' }, { url: img('b2'), tipo: 'IMAGEM' }] },
    ],
}

// Pagina PUBLICA do setor (sem login): o link gravado na tag NFC e
// https://krdsystem.com/vitrine/{slug-da-loja}/{id-do-setor}.
export default function VitrineSetor() {
    const router = useRouter()
    const [setor, setSetor] = useState<ISetorPublico | null>(null)
    const [erro, setErro] = useState('')

    useEffect(() => {
        if (!router.isReady) return
        const { empresaSlug, id } = router.query
        if (process.env.NODE_ENV === 'development' && empresaSlug === 'demo') { setSetor(demo); return }
        // fetch direto (sem os interceptors do axios de usuario logado): a rota e anonima
        const base = (api.defaults.baseURL ?? '').replace(/\/$/, '')
        fetch(`${base}/SetorEstoque/publico/${encodeURIComponent(String(empresaSlug))}/${encodeURIComponent(String(id))}`)
            .then(async res => {
                if (!res.ok) throw new Error(res.status === 404 ? 'Setor não encontrado.' : 'Não foi possível carregar o setor.')
                setSetor(await res.json())
            })
            .catch(e => setErro(e.message || 'Não foi possível carregar o setor.'))
    }, [router.isReady])

    return (
        <>
            <Head>
                <title>{setor ? `${setor.nome} — ${setor.loja.nome}` : 'Setor'}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            </Head>
            {setor ? (
                <Vitrine setor={setor} />
            ) : (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b6b', fontFamily: 'system-ui, sans-serif' }}>
                    {erro || 'Carregando...'}
                </div>
            )}
        </>
    )
}

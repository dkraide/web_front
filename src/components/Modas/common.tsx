import { IModasSite, ModasLinkTipo } from '@/interfaces/IModasSite';
import { Linha, Sel, Txt } from './fields';

export type TabProps = {
    site: IModasSite;
    // Aplica uma mutacao sobre uma copia do documento e salva no estado.
    update: (fn: (draft: IModasSite) => void) => void;
};

export const LINK_OPCOES: { valor: ModasLinkTipo; rotulo: string }[] = [
    { valor: 'novidades', rotulo: 'Novidades' },
    { valor: 'promocoes', rotulo: 'Promoções' },
    { valor: 'categoria', rotulo: 'Categoria' },
    { valor: 'colecao', rotulo: 'Coleção' },
    { valor: 'pagina', rotulo: 'Página da loja' },
    { valor: 'url', rotulo: 'Endereço (URL)' },
];

const DESTINO_DICA: Partial<Record<ModasLinkTipo, string>> = {
    categoria: 'Nome ou código da categoria',
    colecao: 'Nome da categoria que forma a coleção (ou código)',
    pagina: 'Slug da página (aba Rodapé e páginas)',
    url: 'https://…',
};

export function LinkEditor({ tipo, destino, onChange, rotuloTipo = 'Link para' }: {
    tipo: ModasLinkTipo;
    destino: string;
    onChange: (v: { tipo: ModasLinkTipo; destino: string }) => void;
    rotuloTipo?: string;
}) {
    const precisaDestino = tipo !== 'novidades' && tipo !== 'promocoes';
    return (
        <Linha>
            <Sel label={rotuloTipo} value={tipo} opcoes={LINK_OPCOES} onChange={(t) => onChange({ tipo: t, destino })} />
            {precisaDestino && (
                <Txt label="Destino" value={destino} placeholder={DESTINO_DICA[tipo]} onChange={(d) => onChange({ tipo, destino: d })} />
            )}
        </Linha>
    );
}

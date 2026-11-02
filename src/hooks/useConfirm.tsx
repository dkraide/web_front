import { ReactNode, useState } from 'react';
import Confirm from '@/components/Modals/Confirm';

/**
 * Confirmação imperativa: `confirmar('Excluir?', () => remover(id))` e renderize `dialogo` uma vez na tela.
 * Substitui o par de estado `deletar` + `<Confirm>` repetido em cada página.
 */
export function useConfirm() {
    const [pendente, setPendente] = useState<{ message: string, onConfirm: () => void } | null>(null);

    function confirmar(message: string, onConfirm: () => void) {
        setPendente({ message, onConfirm });
    }

    const dialogo: ReactNode = pendente && (
        <Confirm
            message={pendente.message}
            isOpen
            setClose={ok => {
                const { onConfirm } = pendente;
                setPendente(null);
                if (ok) onConfirm();
            }}
        />
    );

    return { confirmar, dialogo };
}

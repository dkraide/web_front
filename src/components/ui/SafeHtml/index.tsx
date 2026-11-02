import { HTMLAttributes, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'dangerouslySetInnerHTML'> {
    html: string
}

/**
 * Renderiza HTML vindo da API depois de sanitizá-lo com DOMPurify.
 * A sanitização só roda no navegador (o DOMPurify não funciona sem DOM e, sem ele, devolveria o HTML intacto),
 * então o conteúdo aparece após a hidratação.
 */
export default function SafeHtml({ html, ...rest }: SafeHtmlProps) {
    const [limpo, setLimpo] = useState('');

    useEffect(() => {
        setLimpo(DOMPurify.sanitize(html, { ADD_ATTR: ['target'] }));
    }, [html]);

    return <div {...rest} dangerouslySetInnerHTML={{ __html: limpo }} />;
}

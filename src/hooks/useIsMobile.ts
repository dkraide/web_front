import { useEffect, useState } from 'react';
import { useWindowSize } from 'rooks';

/** true quando a janela é mais estreita que `breakpoint` (px). Falso até a largura ser conhecida. */
export function useIsMobile(breakpoint = 600) {
    const { innerWidth } = useWindowSize();
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        if (!innerWidth) return;
        setMobile(innerWidth < breakpoint);
    }, [innerWidth, breakpoint]);

    return mobile;
}

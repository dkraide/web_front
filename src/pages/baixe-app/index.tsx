import { GetServerSideProps } from 'next';

// A página foi unificada em /downloads. Mantém o endereço antigo funcionando (QR Codes e links já divulgados).
export default function BaixeApp() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
    redirect: { destination: '/downloads#aplicativo', permanent: false },
});

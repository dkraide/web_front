import Head from "next/head";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ['latin'] });

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>KRD System - Sistema PDV Completo</title>
        <meta name="description" content="Sistema PDV completo com controle de estoque..." />
        <meta name="keywords" content="PDV, sistema, estoque, NFe, NFCe, controle, vendas, gestão" />
      </Head>
      <main className={inter.className}>{children}</main>
    </>
  );
}

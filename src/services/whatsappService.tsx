import { api } from "./apiClient";
import {
  WhatsappCriarIntegracaoDto,
  WhatsappIntegracao,
  WhatsappQrCodeResponse,
} from "../interfaces/whatsapp";

export const whatsappService = {
  async getIntegracao(empresaId: number) {
    const { data } = await api.get<WhatsappIntegracao>(
      `/v2/WhatsappIntegracao`,
      { params: { empresaId } }
    );
    return data;
  },

  async getStatus(empresaId: number) {
    const { data } = await api.get<WhatsappIntegracao>(
      `/v2/WhatsappIntegracao/status`,
      { params: { empresaId } }
    );
    return data;
  },

  async getQrCode(empresaId: number) {
    const { data } = await api.get<WhatsappQrCodeResponse>(
      `/v2/WhatsappIntegracao/qrcode`,
      { params: { empresaId } }
    );
    return data.qrCode;
  },

  async criar(dto: WhatsappCriarIntegracaoDto) {
    const { data } = await api.post<WhatsappIntegracao>(
      `/v2/WhatsappIntegracao`,
      dto
    );
    return data;
  },

  async desconectar(empresaId: number) {
    await api.post(`/v2/WhatsappIntegracao/desconectar`, null, {
      params: { empresaId },
    });
  },

  async excluir(empresaId: number) {
    await api.delete(`/v2/WhatsappIntegracao`, { params: { empresaId } });
  },
};

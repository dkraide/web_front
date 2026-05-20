import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { api } from "./apiClient";

export const materiaPrimaService = {
    async getAll(empresaId: number ) {
        let url = '/v2/materiaprima/list/' + empresaId;
        const { data } = await api.get<IMateriaPrima[]>(
            url
        );
        return data;
    }

}
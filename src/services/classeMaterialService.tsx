import IClasseMaterial from "@/interfaces/IClasseMaterial";
import { api } from "./apiClient";

export const classeMaterialService = {
    async getAll(empresaId: number ) {
        let url = '/v2/classeMaterial/list/' + empresaId;
        const { data } = await api.get<IClasseMaterial[]>(
            url
        );
        return data;
    }

}
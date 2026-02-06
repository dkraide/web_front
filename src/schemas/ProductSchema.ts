import { z } from 'zod';

const numberFromInput = (min: number, message: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val.toString().replace(',', '.'));
      return isNaN(num) ? 0 : num;
    },
    z.number().min(min, message)
  );

const optionalNumberFromInput = () =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val.toString().replace(',', '.'));
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  );

export const productSchema = z.object({
  cod: numberFromInput(1, 'Codé obrigatório'),
  nome: z.string().min(5, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  valorCompra: numberFromInput(0, 'Valor de Compra é obrigatório'),
  valor: numberFromInput(0, 'Valor de Venda é obrigatório'),
  quantidadeMinima: numberFromInput(0, 'Quantidade mínima é obrigatória'),
  quantidade: optionalNumberFromInput(),
  unidadeCompra: z.string().min(2, 'Un Medida é obrigatório'),
  tributacaoId: numberFromInput(1, 'Tributação é obrigatória'),
  idTributacao:  optionalNumberFromInput(),
  classeMaterialId: numberFromInput(1, 'Classe de Material é obrigatória'),
  idClasseMaterial:  optionalNumberFromInput(),
  codigoFornecedor: z.string().optional(),
  multiplicadorFornecedor: optionalNumberFromInput(),
  status: z.boolean(),
  isAlcoholic: z.boolean().default(false),
  codigoBarras: z.string().optional(),
  bloqueiaEstoque: z.boolean(),
  descricaoNutricional: z.string().optional(),
  serving: optionalNumberFromInput(),
  valorKeeta: optionalNumberFromInput(),
  calories: z.string().optional(),
  posicao: optionalNumberFromInput(),
  visivelMenu: z.boolean().default(true)
});

export type ProductFormData = z.infer<typeof productSchema>;

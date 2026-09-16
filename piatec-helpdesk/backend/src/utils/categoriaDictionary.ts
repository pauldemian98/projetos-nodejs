export const categoriaDictionary: Record<string, string[]> = {
  'ERP Protheus': ['protheus', 'erp', 'contabil', 'financeiro', 'faturamento', 'nota fiscal', 'nfe'],
  'Infraestrutura': ['internet', 'rede', 'wifi', 'cabo', 'lento', 'caiu', 'switch', 'roteador'],
  'Hardware': ['mouse', 'teclado', 'monitor', 'computador', 'notebook', 'impressora', 'memoria'],
  'Software': ['windows', 'office', 'excel', 'word', 'email', 'outlook', 'sistema', 'travou'],
};

/**
 * Deduz a categoria baseada em palavras-chave encontradas no texto.
 */
export const deduzirCategoria = (texto: string): string | null => {
  const textoLower = texto.toLowerCase();

  for (const [categoria, keywords] of Object.entries(categoriaDictionary)) {
    for (const keyword of keywords) {
      if (textoLower.includes(keyword)) {
        return categoria;
      }
    }
  }

  return null; // Caso nenhuma regex/palavra-chave bata
};

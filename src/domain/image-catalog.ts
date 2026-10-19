export type CatalogItem = {
  id: string;
  category: string;
  name: string;
  asset: string;
  revision: 1;
  width: number;
  depth: number;
};
const rows: [string, string, string, number, number, string?][] = [
  ["Sala", "sofa", "Sofá", 210, 84],
  ["Sala", "poltrona", "Poltrona", 90, 85],
  ["Sala", "mesa-centro", "Mesa de centro", 110, 60],
  ["Sala", "rack", "Rack", 160, 40],
  ["Sala", "cadeira", "Cadeira", 45, 50],
  ["Sala", "mesa-retangular", "Mesa retangular", 160, 90],
  ["Sala", "mesa-redonda-4-cadeiras", "Mesa redonda com 4 cadeiras", 200, 200],
  [
    "Sala",
    "mesa-retangular-6-cadeiras",
    "Mesa retangular com 6 cadeiras",
    260,
    190,
  ],
  ["Quarto", "cama-solteiro", "Cama de solteiro", 90, 190],
  ["Quarto", "cama-casal", "Cama de casal", 138, 188],
  ["Quarto", "cama-queen", "Cama queen", 158, 198],
  ["Quarto", "cama-king", "Cama king", 193, 203],
  ["Quarto", "mesa-cabeceira", "Mesa de cabeceira", 45, 40],
  ["Quarto", "guarda-roupa", "Guarda-roupa", 180, 60],
  ["Cozinha", "armario", "Armário", 120, 60],
  ["Cozinha", "bancada", "Bancada", 120, 60],
  ["Cozinha", "pia", "Pia", 120, 60],
  ["Cozinha", "geladeira", "Geladeira", 70, 70],
  ["Cozinha", "cooktop", "Cooktop", 60, 50],
  ["Cozinha", "micro-ondas", "Micro-ondas", 50, 40],
  ["Banheiro", "lavatorio", "Lavatório", 55, 45],
  ["Banheiro", "vaso-sanitario", "Vaso sanitário", 38, 70],
  ["Banheiro", "chuveiro", "Chuveiro", 25, 35],
  ["Banheiro", "box", "Box", 90, 90],
  ["Lavanderia", "tanque", "Tanque", 60, 55],
  ["Lavanderia", "maquina-lavar", "Máquina de lavar", 60, 65],
  ["Lavanderia", "armario-lavanderia", "Armário", 120, 60, "armario"],
  ["Outros", "carro", "Carro", 180, 430],
  ["Outros", "caixa-agua", "Caixa-d’água", 150, 150],
  ["Outros", "condensadora", "Condensadora de ar", 80, 35],
  ["Outros", "extintor", "Extintor", 25, 25],
  ["Varanda", "mesa-redonda", "Mesa redonda", 100, 100],
  ["Varanda", "banco", "Banco", 140, 45],
  ["Varanda", "banqueta", "Banqueta", 35, 35],
  ["Varanda", "espreguicadeira", "Espreguiçadeira", 70, 190],
  ["Varanda", "piscina", "Piscina", 300, 600],
  ["Paisagismo", "arvore", "Árvore ornamental", 300, 300],
  ["Paisagismo", "vaso-planta", "Vaso com planta", 45, 45],
  ["Paisagismo", "canteiro", "Canteiro", 150, 40],
  ["Paisagismo", "cerca-viva", "Cerca viva", 150, 50],
];
export const imageCatalog: readonly CatalogItem[] = rows.map(
  ([category, id, name, width, depth, asset]) => ({
    category,
    id,
    name,
    width: width * 100,
    depth: depth * 100,
    asset: asset ?? id,
    revision: 1,
  }),
);
export const imageCategories = [
  ...new Set(imageCatalog.map((i) => i.category)),
];
export const catalogItem = (id: string, revision: number) =>
  imageCatalog.find((i) => i.id === id && i.revision === revision);
export const catalogUrl = (i: CatalogItem) =>
  `/catalog/m10/${i.asset}-r${i.revision}.png`;

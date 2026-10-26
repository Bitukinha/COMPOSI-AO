import { sql, rota } from "../lib/db.js";

// GET /api/dados -> catálogo completo e todas as linhas de composição
export default rota({
  async GET(req, res) {
    const [produtos, composicao] = await Promise.all([
      sql`select cod, descricao as "desc", categoria as cat, linha, embalagem as emb, peso::float8 as peso
          from produtos order by cod`,
      sql`select prod, comp, qtd::float8 as qtd, unidade as un, obs
          from composicao order by prod, comp`,
    ]);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ produtos, composicao });
  },
});

import { sql, rota, falha, inteiro } from "../lib/db.js";

// POST /api/copiar {de, para}: copia a composição de um produto para outro,
// mantendo os componentes que o destino já tem
export default rota({
  async POST(req, res) {
    const de = inteiro(req.body?.de), para = inteiro(req.body?.para);
    if (de === null || para === null) return falha(res, 400, "Informe os dois produtos.");
    if (de === para) return falha(res, 400, "Escolha um produto diferente do atual.");
    const [{ n }] = await sql`select count(*)::int as n from composicao where prod = ${de}`;
    if (!n) return falha(res, 404, `O produto ${de} ainda não tem composição cadastrada.`);
    const r = await sql`insert into composicao (prod, comp, qtd, unidade, obs)
      select ${para}::int, comp, qtd, unidade, obs from composicao where prod = ${de} and comp <> ${para}
      on conflict (prod, comp) do nothing returning comp`;
    res.status(200).json({ ok: true, copiados: r.length, pulados: n - r.length });
  },
});

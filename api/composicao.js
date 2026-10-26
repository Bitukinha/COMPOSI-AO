import { sql, rota, falha, inteiro, UNIDADES } from "../lib/db.js";

export default rota({
  // adicionar ou atualizar um componente: {prod, comp, qtd, un, obs}
  async PUT(req, res) {
    const b = req.body ?? {};
    const prod = inteiro(b.prod), comp = inteiro(b.comp), qtd = Number(b.qtd);
    if (prod === null) return falha(res, 400, "Selecione o produto.");
    if (comp === null) return falha(res, 400, "Selecione o componente.");
    if (prod === comp) return falha(res, 400, "Um item não pode ser componente dele mesmo.");
    if (!Number.isFinite(qtd) || qtd <= 0) return falha(res, 400, "A quantidade precisa ser maior que zero.");
    if (!UNIDADES.includes(b.un)) return falha(res, 400, "Unidade inválida.");
    const obs = String(b.obs ?? "").trim();
    const r = await sql`insert into composicao (prod, comp, qtd, unidade, obs)
      values (${prod}, ${comp}, ${qtd}, ${b.un}, ${obs})
      on conflict (prod, comp) do update set qtd = excluded.qtd, unidade = excluded.unidade, obs = excluded.obs
      returning (xmax = 0) as novo`;
    res.status(200).json({ ok: true, acao: r[0].novo ? "adicionado" : "atualizado" });
  },
  // DELETE /api/composicao?prod=16&comp=1 remove um componente;
  // DELETE /api/composicao?prod=16 remove a composição inteira
  async DELETE(req, res) {
    const prod = inteiro(req.query.prod);
    if (prod === null) return falha(res, 400, "Informe o produto.");
    if (req.query.comp === undefined) {
      const r = await sql`delete from composicao where prod = ${prod} returning comp`;
      return res.status(200).json({ ok: true, removidos: r.length });
    }
    const comp = inteiro(req.query.comp);
    if (comp === null) return falha(res, 400, "Informe o componente.");
    const r = await sql`delete from composicao where prod = ${prod} and comp = ${comp} returning comp`;
    res.status(200).json({ ok: true, removidos: r.length });
  },
});

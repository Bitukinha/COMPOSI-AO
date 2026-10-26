import { sql, rota, falha, inteiro, EMBALAGENS } from "../lib/db.js";

function lerItem(b, res) {
  const cod = inteiro(b?.cod);
  if (cod === null) return falha(res, 400, "O código precisa ser numérico.");
  const desc = String(b.desc ?? "").trim().toUpperCase();
  if (!desc) return falha(res, 400, "Informe a descrição.");
  const peso = b.peso === null || b.peso === "" || b.peso === undefined ? null : Number(b.peso);
  if (peso !== null && !(peso > 0)) return falha(res, 400, "O peso precisa ser maior que zero.");
  const emb = EMBALAGENS.includes(b.emb) ? b.emb : "Não informado";
  return {
    cod, desc, emb, peso,
    cat: String(b.cat ?? "").trim() || "Não informado",
    linha: String(b.linha ?? "").trim() || "—",
  };
}

export default rota({
  // novo item
  async POST(req, res) {
    const p = lerItem(req.body, res); if (!p) return;
    const r = await sql`insert into produtos (cod, descricao, categoria, linha, embalagem, peso)
      values (${p.cod}, ${p.desc}, ${p.cat}, ${p.linha}, ${p.emb}, ${p.peso})
      on conflict (cod) do nothing returning cod`;
    if (!r.length) return falha(res, 409, `Já existe um item com o código ${p.cod}.`);
    res.status(201).json({ ok: true });
  },
  // editar item existente
  async PUT(req, res) {
    const p = lerItem(req.body, res); if (!p) return;
    const r = await sql`update produtos set descricao = ${p.desc}, categoria = ${p.cat}, linha = ${p.linha},
      embalagem = ${p.emb}, peso = ${p.peso} where cod = ${p.cod} returning cod`;
    if (!r.length) return falha(res, 404, `O item ${p.cod} não existe.`);
    res.status(200).json({ ok: true });
  },
  // DELETE /api/produtos?cod=16
  async DELETE(req, res) {
    const cod = inteiro(req.query.cod);
    if (cod === null) return falha(res, 400, "Informe o código.");
    const [{ n }] = await sql`select count(*)::int as n from composicao where prod = ${cod} or comp = ${cod}`;
    if (n) return falha(res, 409, `O item ${cod} aparece em ${n} linha(s) de composição. Remova essas linhas antes de excluir o item.`);
    await sql`delete from produtos where cod = ${cod}`;
    res.status(200).json({ ok: true });
  },
});

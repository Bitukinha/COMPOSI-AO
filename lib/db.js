import { neon } from "@neondatabase/serverless";
import seed from "./seed.js";

if (!process.env.DATABASE_URL) throw new Error("Defina a variável de ambiente DATABASE_URL (string de conexão do Neon).");

export const sql = neon(process.env.DATABASE_URL);

// Cria as tabelas na primeira chamada de cada instância e, se o catálogo estiver vazio,
// carrega os itens da planilha original.
let pronto;
export function ensure() {
  pronto ??= (async () => {
    await sql`create table if not exists produtos (
      cod        integer primary key,
      descricao  text    not null,
      categoria  text    not null default 'Não informado',
      linha      text    not null default '—',
      embalagem  text    not null default 'Não informado',
      peso       numeric
    )`;
    await sql`create table if not exists composicao (
      prod     integer not null references produtos(cod) on delete restrict,
      comp     integer not null references produtos(cod) on delete restrict,
      qtd      numeric not null check (qtd > 0),
      unidade  text    not null,
      obs      text    not null default '',
      primary key (prod, comp),
      check (prod <> comp)
    )`;
    const [{ n }] = await sql`select count(*)::int as n from produtos`;
    if (n === 0) {
      await sql`insert into produtos (cod, descricao, categoria, linha, embalagem, peso)
        select cod, descricao, categoria, linha, embalagem, peso
        from jsonb_to_recordset(${JSON.stringify(seed)}::jsonb)
          as x(cod int, descricao text, categoria text, linha text, embalagem text, peso numeric)
        on conflict do nothing`;
    }
  })().catch(e => { pronto = undefined; throw e; });
  return pronto;
}

export const UNIDADES = ["kg", "g", "t", "un", "L", "mL", "m", "%"];
export const EMBALAGENS = ["Saco", "Big Bag", "Granel", "Por kg", "Pacote", "Insumo", "Não informado"];

export const inteiro = v => (/^\d+$/.test(String(v ?? "").trim()) ? Number(v) : null);

export function falha(res, status, erro) {
  res.status(status).json({ erro });
}

// Envolve um handler: garante o schema, trata métodos e erros do Postgres.
export function rota(metodos) {
  return async (req, res) => {
    const fn = metodos[req.method];
    if (!fn) {
      res.setHeader("Allow", Object.keys(metodos).join(", "));
      return falha(res, 405, "Método não permitido.");
    }
    try {
      await ensure();
      await fn(req, res);
    } catch (e) {
      if (e?.code === "23503") return falha(res, 409, "O item está em uso numa composição.");
      if (e?.code === "23505") return falha(res, 409, "Registro já existe.");
      if (e?.code === "23514") return falha(res, 400, "Valores inválidos.");
      console.error(e);
      falha(res, 500, "Erro no servidor. Tente de novo em alguns segundos.");
    }
  };
}

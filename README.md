# Nutrimilho · Composição de produtos

App web que substitui a planilha `Nutrimilho_Composicao.xlsm` e suas macros (`modComposicao.bas`).

- **Cadastro**: escolher o produto, adicionar, editar e remover componentes, copiar a composição de outro produto e excluir a composição inteira. Mostra a conferência entre a soma dos componentes (kg/g/t) e o peso do produto.
- **Ficha técnica**: produto + lote, com o consumo de cada componente; exporta CSV.
- **Produtos**: catálogo com busca e filtro, novo item, edição e exclusão (bloqueada se o item estiver em uso).
- **Resumo**: itens por categoria e por embalagem, e quantos já têm composição.

## Estrutura

```
public/index.html   front-end (HTML/CSS/JS puro, sem build)
api/*.js            funções serverless da Vercel
lib/db.js           conexão com o Neon, criação das tabelas e carga inicial
lib/seed.js         os 63 itens da aba Produtos da planilha
scripts/dev.js      servidor local que imita a Vercel
```

As tabelas `produtos` e `composicao` são criadas automaticamente na primeira chamada à API. Se `produtos` estiver vazia, os itens da planilha são carregados.

## Deploy na Vercel

1. Na Vercel, **Add New → Project** e importe este repositório. Não precisa de Build Command; o Output Directory já está em `vercel.json` (`public`).
2. Em **Settings → Environment Variables**, crie `DATABASE_URL` com a string de conexão do Neon (de preferência a URL *pooled*). Marque Production, Preview e Development.
3. Faça o deploy. Se a integração Neon da Vercel já estiver ligada ao projeto, ela cria `DATABASE_URL` sozinha.

## Rodar localmente

```bash
npm install
cp .env.example .env   # e coloque a sua DATABASE_URL
npm run dev            # http://localhost:3000
```

## API

| Método | Rota | Corpo / query |
|---|---|---|
| GET | `/api/dados` | retorna `{produtos, composicao}` |
| POST / PUT | `/api/produtos` | `{cod, desc, cat, linha, emb, peso}` (POST cria, PUT edita) |
| DELETE | `/api/produtos?cod=16` | |
| PUT | `/api/composicao` | `{prod, comp, qtd, un, obs}` (adiciona ou atualiza) |
| DELETE | `/api/composicao?prod=16&comp=1` | sem `comp` apaga a composição inteira |
| POST | `/api/copiar` | `{de, para}` |

> O app não tem login: quem tiver o link pode editar. Para restringir, ative a **Vercel Authentication / Password Protection** do projeto.

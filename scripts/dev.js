// Servidor local que imita a Vercel: arquivos de public/ e funções de api/.
// Uso: crie um .env com DATABASE_URL e rode `npm run dev`.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const porta = Number(process.env.PORT) || 3000;
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };

  if (url.pathname.startsWith("/api/")) {
    const nome = url.pathname.slice(5).replace(/[^a-z0-9_-]/gi, "");
    try {
      const { default: handler } = await import(pathToFileURL(join(raiz, "api", nome + ".js")).href);
      let corpo = "";
      for await (const parte of req) corpo += parte;
      req.query = Object.fromEntries(url.searchParams);
      req.body = corpo ? JSON.parse(corpo) : undefined;
      await handler(req, res);
    } catch (e) {
      if (e.code === "ERR_MODULE_NOT_FOUND") { res.status(404).json({ erro: "Rota não encontrada." }); return; }
      console.error(e);
      res.status(500).json({ erro: String(e.message || e) });
    }
    return;
  }

  const caminho = normalize(join(raiz, "public", url.pathname === "/" ? "index.html" : url.pathname));
  if (!caminho.startsWith(join(raiz, "public"))) { res.statusCode = 403; return res.end(); }
  try {
    const dados = await readFile(caminho);
    res.setHeader("Content-Type", tipos[extname(caminho)] || "application/octet-stream");
    res.end(dados);
  } catch {
    res.statusCode = 404; res.end("Não encontrado");
  }
}).listen(porta, () => console.log(`Nutrimilho em http://localhost:${porta}`));

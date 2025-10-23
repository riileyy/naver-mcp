import express from "express";
import cors from "cors";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors()); // 모든 출처 허용
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// health/UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

// discovery for Smithery
app.get("/.well-known/mcp", (req, res) => {
  res.json({
    id: "naver-mcp",
    name: "Naver Search MCP",
    description: "Users provide their own Naver Client ID/Secret and get a personal MCP URL.",
    endpoints: { mcp: "/mcp", auth: "/auth" }
  });
});

// simple auth UI that returns personal URL (used by users to generate URL)
app.get("/auth", (req, res) => {
  res.send(`
    <html><head><meta charset="utf-8"><title>Naver MCP Auth</title></head>
    <body style="font-family:sans-serif;max-width:560px;margin:30px auto;">
      <h2>Naver Search — 개인 MCP URL 생성</h2>
      <p>네이버 개발자 센터에서 발급받은 <b>Client ID</b>와 <b>Client Secret</b>을 입력하세요.</p>
      <form method="GET" action="/mcp">
        <label>Client ID</label><br/>
        <input name="cid" required style="width:100%;padding:8px;margin:6px 0;"><br/>
        <label>Client Secret</label><br/>
        <input name="sec" required style="width:100%;padding:8px;margin:6px 0;"><br/>
        <button type="submit" style="padding:8px 12px;margin-top:8px;">개인 MCP URL 생성</button>
      </form>
      <p style="color:gray;font-size:12px;margin-top:10px;">주의: 입력하신 값은 서버에 저장되지 않고, URL 쿼리로만 사용됩니다.</p>
    </body></html>
  `);
});

// JSON-RPC /mcp endpoint (Smithery scanner uses this)
app.post("/mcp", async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== "2.0") {
    return res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32600, message: "jsonrpc must be 2.0" } });
  }

  // initialize
  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-06-18",
        serverInfo: { name: "naver-mcp", version: "1.0.0" },
        capabilities: { tools: {} }
      }
    });
  }

  // tools/list
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "naver.search",

import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { nanoid } from "nanoid";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==== 간단한 파일 기반 저장 ====
const DATA_FILE = path.join(process.cwd(), "profiles.json");
let profiles = {};
if (fs.existsSync(DATA_FILE)) {
  profiles = JSON.parse(fs.readFileSync(DATA_FILE));
}
const saveProfiles = () => fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));

// ==== 루트 & health check ====
app.get("/", (req, res) => {
  res.send("✅ Naver MCP Server is running");
});

// ==== Discovery endpoint (Smithery scanner용) ====
app.get("/.well-known/mcp", (req, res) => {
  res.json({
    id: "naver-mcp",
    name: "Naver Search MCP",
    description: "Users provide their own Naver Client ID/Secret and get a personal MCP URL.",
    authorization_endpoint: "/auth",
    endpoints: { mcp: "/mcp" }
  });
});

// ==== Auth UI ====
app.get("/auth", (req, res) => {
  res.send(`
    <html><head><meta charset="utf-8"><title>Naver MCP Auth</title></head>
    <body style="font-family:sans-serif;max-width:560px;margin:30px auto;">
      <h2>Naver Search — 개인 MCP URL 생성</h2>
      <p>네이버 개발자 센터에서 발급받은 <b>Client ID</b>와 <b>Client Secret</b>을 입력하세요.</p>
      <form method="POST" action="/auth">
        <label>Client ID</label><br/>
        <input name="clientId" required style="width:100%;padding:8px;margin:6px 0;"><br/>
        <label>Client Secret</label><br/>
        <input name="clientSecret" required style="width:100%;padding:8px;margin:6px 0;"><br/>
        <button type="submit" style="padding:8px 12px;margin-top:8px;">개인 MCP URL 생성</button>
      </form>
      <p style="color:gray;font-size:12px;margin-top:10px;">
        입력하신 값은 서버에 안전하게 저장되며, 개인 URL 생성에만 사용됩니다.
      </p>
    </body></html>
  `);
});

// ==== Auth POST (프로필 생성 및 URL 반환) ====
app.post("/auth", (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) return res.status(400).send("Missing parameters");

  const profileId = nanoid(10);
  profiles[profileId] = { clientId, clientSecret };
  saveProfiles();

  const url = `${req.protocol}://${req.get("host")}/mcp?profile=${profileId}`;
  res.send(`
    <p>✅ 개인 MCP URL이 생성되었습니다:</p>
    <p><a href="${url}" target="_blank">${url}</a></p>
  `);
});

// ==== MCP endpoint (Smithery 호출) ====
app.get("/mcp", async (req, res) => {
  const profileId = req.query.profile;
  const q = req.query.q;
  const type = req.query.type || "web";

  if (!profileId || !profiles[profileId]) return res.status(400).json({ error: "Invalid profile" });
  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });

  const { clientId, clientSecret } = profiles[profileId];

  try {
    const response = await fetch(`https://openapi.naver.com/v1/search/${type}.json?query=${encodeURIComponent(q)}&display=10`, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Naver API request failed", detail: err.message });
  }
});

// ==== 서버 시작 ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Naver MCP server running on port ${PORT}`));

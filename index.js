import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// 메모리 저장 (간단용, DB 가능)
const users = {};

// 🔹 Step1: 등록 & 개인 URL 발급
app.post("/register", (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "Client ID와 Secret을 입력하세요" });
  }

  const userKey = crypto.randomBytes(16).toString("hex");
  users[userKey] = { clientId, clientSecret };

  const userUrl = `${req.protocol}://${req.get("host")}/search?key=${userKey}`;
  return res.json({ url: userUrl });
});

// 🔹 Step2: 검색
app.get("/search", async (req, res) => {
  const { key, query } = req.query;
  if (!key || !users[key]) return res.status(401).json({ error: "잘못된 키입니다" });
  if (!query) return res.status(400).json({ error: "검색어(query)를 입력하세요." });

  const { clientId, clientSecret } = users[key];

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}`,
      { headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Step3: Frontend
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "frontend.html")));

app.listen(PORT, () => console.log(`MCP Server running on port ${PORT}`));

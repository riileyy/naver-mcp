import express from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { nanoid } from "nanoid";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(process.cwd(), "profiles.json");

// --- 프로필 로드 / 저장 ---
let profiles = {};
if (fs.existsSync(DATA_FILE)) profiles = JSON.parse(fs.readFileSync(DATA_FILE));
const saveProfiles = () => fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));

// --- Root ---
app.get("/", (req, res) => res.send("✅ Naver MCP Server running"));

// --- Discovery ---
app.get("/.well-known/mcp", (req, res) => {
  res.json({
    id: "naver-mcp",
    name: "Naver Search MCP",
    description: "Users provide Client ID/Secret via Configure and get personal MCP URL",
    authorization_endpoint: "/configure",
    endpoints: { mcp: "/mcp" }
  });
});

// --- Configure POST (Smithery Connect에서 키 입력) ---
app.post("/configure", (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) return res.status(400).json({ error: "Missing clientId or clientSecret" });

  const profileId = nanoid(10);
  profiles[profileId] = { clientId, clientSecret };
  saveProfiles();

  const personalUrl = `/mcp?profile=${profileId}`;
  res.json({ url: personalUrl });
});

// --- MCP POST (JSON-RPC / Smithery Scanner) ---
app.post("/mcp", async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== "2.0") return res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32600, message: "jsonrpc must be 2.0" } });

  // --- initialize ---
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

  // --- tools/list ---
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "naver.search",
            description: "Search Naver (web/news/blog/shop/book)",
            inputSchema: {
              type: "object",
              properties: {
                q: { type: "string" },
                type: { type: "string", enum: ["web","news","blog","shop","book"], default: "web" },
                profile: { type: "string" }
              },
              required: ["q","profile"]
            }
          }
        ]
      }
    });
  }

  // --- tools/call ---
  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    if (name !== "naver.search") return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Unknown tool" } });

    const profileId = args?.profile;
    if (!profileId || !profiles[profileId]) return res.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid profile" } });

    const { clientId, clientSecret } = profiles[profileId];
    const q = args?.q;
    const type = args?.type || "web";

    if (!q) return res.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Missing query" } });

    try {
      const apiRes = await fetch(`https://openapi.naver.com/v1/search/${type}.json?query=${encodeURIComponent(q)}&display=10`, {
        headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret }
      });
      const data = await apiRes.json();
      return res.json({ jsonrpc: "2.0", id, result: { items: data.items || data } });
    } catch (err) {
      return res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: "Naver API request failed", data: err.message } });
    }
  }

  // --- 기타 요청 무조건 Unknown method로 처리 ---
  return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });
});

// --- 서버 시작 ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Naver MCP server running on port ${PORT}`));

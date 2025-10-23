import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const { apiKey, profile } = req.body;

  if (!apiKey) return res.status(400).json({ error: "API Key가 필요합니다." });

  try {
    const url = new URL("https://server.smithery.ai/@isnow890/naver-search-mcp/mcp");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("profile", profile || "default-profile");

    const transport = new StreamableHTTPClientTransport(url.toString());
    const client = new Client({ name: "My MCP App", version: "1.0.0" });

    await client.connect(transport);
    const tools = await client.listTools();

    res.status(200).json({ tools: tools.map(t => t.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

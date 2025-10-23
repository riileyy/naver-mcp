import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Naver MCP Server is running");
});

app.post("/search", async (req, res) => {
  try {
    const { query, clientId, clientSecret } = req.body;

    if (!query || !clientId || !clientSecret) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const response = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

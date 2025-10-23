// index.js
import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🔹 메모리 저장 (간단한 예제, 실제는 DB 추천)
const users = {};

// 🔹 Step 1: 사용자 등록 및 개인 URL 발급
app.post("/register", (req, res) => {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
        return res.status(400).json({ error: "Client ID와 Secret을 입력하세요" });
    }

    // 개인화된 서버 키 생성
    const userKey = crypto.randomBytes(16).toString("hex");
    users[userKey] = { clientId, clientSecret };

    // 발급 URL (예: https://YOUR_DOMAIN/search?key=XXXX)
    const userUrl = `${req.protocol}://${req.get("host")}/search?key=${userKey}`;
    return res.json({ url: userUrl });
});

// 🔹 Step 2: 검색 요청 처리
app.get("/search", async (req, res) => {
    const { key, query } = req.query;
    if (!key || !users[key]) {
        return res.status(401).json({ error: "잘못된 키입니다. 먼저 등록하세요." });
    }
    if (!query) {
        return res.status(400).json({ error: "검색어(query)를 입력하세요." });
    }

    const { clientId, clientSecret } = users[key];

    try {
        const response = await fetch(`https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}`, {
            headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret
            }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

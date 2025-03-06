const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// LINE & ChatGPT API Keys (記得在 Vercel 設定環境變數)
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());

// 測試首頁
app.get("/", (req, res) => {
    res.send("ChatGPT LINE Bot is running!");
});

// 處理 LINE webhook
app.post("/webhook", async (req, res) => {
    res.status(200).send({ status: "ok" });
    const events = req.body.events;
    for (let event of events) {
        if (event.type === "message" && event.message.type === "text") {
            const userMessage = event.message.text;
            const replyToken = event.replyToken;
            
            const aiReply = await getChatGPTReply(userMessage);
            await replyToUser(replyToken, aiReply);
        }
    }
});

// 取得 ChatGPT 回應
async function getChatGPTReply(message) {
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "你是一個專業的化妝與霧眉助理，請幫助回答客戶的問題。" }, { role: "user", content: message }]
        }, {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("ChatGPT API Error:", error);
        return "抱歉，我暫時無法回應，請稍後再試。";
    }
}

// 回覆使用者
async function replyToUser(replyToken, text) {
    try {
        await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken: replyToken,
            messages: [{ type: "text", text: text }]
        }, {
            headers: {
                "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("LINE API Error:", error);
    }
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

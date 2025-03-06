const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// LINE & ChatGPT API Keys (記得在 Vercel 設定環境變數)
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());  // ✅ 確保 Vercel 正確解析 JSON

// 測試首頁
app.get("/", (req, res) => {
    console.log("✅ 訪問首頁成功！");
    res.send("ChatGPT LINE Bot is running!");
});

// 處理 LINE webhook
app.post("/webhook", async (req, res) => {
    console.log("📩 收到 LINE Webhook 請求", req.body);  // ✅ 確保 Vercel 有收到請求
    try {
        res.status(200).send({ status: "ok" });

        const events = req.body.events;
        if (!events || events.length === 0) {
            console.log("⚠️ 無 Webhook 事件");
            return;
        }

        for (let event of events) {
            if (event.type === "message" && event.message.type === "text") {
                const userMessage = event.message.text;
                const replyToken = event.replyToken;

                console.log(`👤 使用者傳送訊息: ${userMessage}`);

                const aiReply = await getChatGPTReply(userMessage);
                await replyToUser(replyToken, aiReply);
            }
        }
    } catch (error) {
        console.error("❌ Webhook 處理錯誤:", error);
    }
});

// 取得 ChatGPT 回應
async function getChatGPTReply(message) {
    try {
        console.log("🧠 發送 ChatGPT API 請求...");
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "你是一個專業的化妝與霧眉助理，請幫助回答客戶的問題。" }, { role: "user", content: message }]
        }, {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        console.log("✅ ChatGPT 回應成功");
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("❌ ChatGPT API Error:", error);
        return "抱歉，我暫時無法回應，請稍後再試。";
    }
}

// 回覆使用者
async function replyToUser(replyToken, text) {
    try {
        console.log("📤 發送回覆訊息給 LINE...");
        await axios.post("https://api.line.me/v2/bot/message/reply", {
            replyToken: replyToken,
            messages: [{ type: "text", text: text }]
        }, {
            headers: {
                "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log("✅ 訊息已發送給使用者");
    } catch (error) {
        console.error("❌ LINE API Error:", error);
    }
}

// 確保伺服器在 Vercel 正確監聽
app.listen(port, () => {
    console.log(`🚀 Server is running on

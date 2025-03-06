app.post("/webhook", async (req, res) => {
    console.log("📩 收到 LINE Webhook 請求", req.body);
    res.status(200).send({ status: "ok" });

    const events = req.body.events;
    for (let event of events) {
        // 🛑 忽略「加入好友」事件，避免發送歡迎訊息
        if (event.type === "follow") {
            console.log("👤 用戶加入好友，但未發送歡迎訊息");
            continue;  // 跳過這個事件，不回應任何訊息
        }

        // 🟢 處理用戶的文字訊息
        if (event.type === "message" && event.message.type === "text") {
            const userMessage = event.message.text;
            const replyToken = event.replyToken;
            
            const aiReply = await getChatGPTReply(userMessage);
            await replyToUser(replyToken, aiReply);
        }
    }
});

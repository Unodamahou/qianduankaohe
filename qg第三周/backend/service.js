const express = require("express");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.post("/api", (req, res) => {
    const requestBody = req.body;
    console.log("接收到的请求体:", requestBody);
    res.json({ status: "success", data: requestBody });
});
app.listen(3000, () => console.log("后端运行在 http://localhost:3000"));
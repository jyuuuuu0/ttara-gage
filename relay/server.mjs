// 잇플 API 고정 IP 중계 서버 (의존성 없음, Node 18+)
//
// 잇플 API는 등록된 고정 IP에서만 호출된다. Vercel은 IP가 바뀌므로
// 고정 IP 서버(예: AWS Lightsail/EC2 + 고정 IP)에 이 파일 하나만 띄우고, 그 IP를 잇플에 등록한다.
//
// 실행:
//   RELAY_SECRET=아무_긴_문자열 EATPL_BASE_URL=https://dev-api.paybooc.ai/api/mer PORT=8080 node server.mjs
// 앱(Vercel) 환경변수:
//   EATPL_MODE=live, EATPL_INST_NM=발급받은기관명,
//   EATPL_RELAY_URL=https://중계서버주소, EATPL_RELAY_SECRET=위와 같은 문자열
import http from "node:http";

const PORT = Number(process.env.PORT ?? 8080);
const SECRET = process.env.RELAY_SECRET ?? "";
const UPSTREAM = (process.env.EATPL_BASE_URL ?? "https://dev-api.paybooc.ai/api/mer").replace(/\/$/, "");
const MAX_BODY = 4096;

if (SECRET.length < 16) {
  console.error("RELAY_SECRET 을 16자 이상으로 설정하세요.");
  process.exit(1);
}

const send = (res, status, obj) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
};

http
  .createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });
    if (req.method !== "POST" || req.url !== "/v1/search") return send(res, 404, { error: "not found" });
    if (req.headers["x-relay-secret"] !== SECRET) return send(res, 401, { error: "unauthorized" });

    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > MAX_BODY) return send(res, 413, { error: "too large" });
    }
    try {
      JSON.parse(body);
    } catch {
      return send(res, 400, { error: "invalid json" });
    }

    try {
      const up = await fetch(`${UPSTREAM}/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        signal: AbortSignal.timeout(8000),
      });
      const text = await up.text();
      res.writeHead(up.status, { "Content-Type": up.headers.get("content-type") ?? "application/json" });
      res.end(text);
    } catch (e) {
      console.error("[relay]", e);
      send(res, 502, { error: "upstream unreachable" });
    }
  })
  .listen(PORT, () => console.log(`relay listening on :${PORT} → ${UPSTREAM}`));

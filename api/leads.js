const PHONE_RE = /^1[3-9]\d{9}$/;

function json(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, 405, { error: "Method Not Allowed" });

  const body = request.body || {};
  const company = String(body.company || "").trim();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();

  if (!company) return json(response, 400, { error: "请填写公司名称" });
  if (!name) return json(response, 400, { error: "请填写姓名" });
  if (!PHONE_RE.test(phone)) return json(response, 400, { error: "请填写有效的 11 位手机号" });
  if (!body.consent) return json(response, 400, { error: "请同意联系授权后再提交" });

  const lead = {
    createdAt: new Date().toISOString(),
    source: String(body.source || "lumino-website"),
    company,
    name,
    phone,
    email,
    context: body.context || null,
    userAgent: request.headers["user-agent"] || "",
  };

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.error("[lumino-lead] LEAD_WEBHOOK_URL is not configured", lead);
    return json(response, 503, { error: "留资通道尚未配置，请改用预约诊断" });
  }

  try {
    const upstream = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error(`Webhook returned ${upstream.status}`);
    return json(response, 200, { ok: true });
  } catch (error) {
    console.error("[lumino-lead] delivery failed", error, lead);
    return json(response, 502, { error: "提交失败，请稍后重试" });
  }
}

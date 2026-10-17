
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const SENDER_EMAIL = "redchatbusiness@outlook.com";
const SENDER_NAME = "RedChat Support";
const RECIPIENT_EMAIL = "gogeta.blue053wow@gmail.com";
const RECIPIENT_NAME = "Gg00Cat";

const BANNER_URL = "https://i.imgur.com/SX2SgAP.png";
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeadG3_WM68ulv2Yh7aeZa-XwqC87jl05f_2WFQ2oQMq_ML3Q/viewform?usp=publish-editor";

let status = {
  state: "starting",
  message: "Gönderim hazırlanıyor."
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function sendJSON(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function createEmailHTML() {
  const formURL = escapeHTML(FORM_URL);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RedChat | Ban İtirazı</title>
</head>
<body style="margin:0;padding:24px 10px;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#263650;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dfe7f2;border-radius:14px;overflow:hidden;">
<tr><td>
<img src="${BANNER_URL}" width="600" alt="RedChat — Ban İtiraz Merkezi" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>
<tr><td style="padding:28px 24px;font-size:14px;line-height:1.8;">
<p style="font-size:12px;letter-spacing:1px;color:#3766d5;font-weight:bold;">&#128737; REDCHAT SUPPORT</p>
<h1 style="font-size:24px;line-height:1.35;color:#192d50;">Ban itirazınız hakkında bilgilendirme</h1>

<p>Merhaba <strong>Gg00Cat</strong>,</p>

<p>RedChat hesaplarınızla ilişkili önceki kayıtlar ve önceki engelleri aşma girişimleri nedeniyle mevcut <strong>IP/cihaz engeliniz şimdilik devam etmektedir.</strong></p>

<p>Yeniden değerlendirme talebinizi iletmek isterseniz aşağıdaki form üzerinden açıklamalarınızı gönderebilirsiniz.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5ff;border:1px solid #dce7ff;border-radius:10px;">
<tr><td style="padding:15px;font-size:13px;line-height:1.7;">
<strong>&#9432; Önemli bilgilendirme</strong><br>
Formu göndermek, engelinizin kaldırılacağını garanti etmez. Başvurunuz mevcut kayıtlar ve açıklamalarınız doğrultusunda değerlendirilecektir.
</td></tr></table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:25px auto;">
<tr><td bgcolor="#285fe8" style="border-radius:8px;">
<a href="${formURL}" style="display:inline-block;padding:14px 21px;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:8px;">Yeniden Erişim Formunu Aç &#8599;</a>
</td></tr></table>

<p>Saygılarımızla,<br><strong>RedChat Yönetimi</strong></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f8faff;border-top:1px solid #edf1f7;color:#78869b;font-size:11px;line-height:1.6;">
Bu e-posta RedChat ban itirazı süreci hakkında bilgilendirme amacıyla gönderilmiştir.<br>
RedChat Support · Ban İtiraz Merkezi
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

async function sendEmailOnce() {
  if (!BREVO_API_KEY) {
    status = {
      state: "error",
      message: "BREVO_API_KEY bulunamadı. Replit Secrets ayarını kontrol et."
    };
    console.error(status.message);
    return;
  }

  status = {
    state: "sending",
    message: "E-posta Brevo üzerinden gönderiliyor."
  };

  const textContent = `Merhaba Gg00Cat,

RedChat hesaplarınızla ilişkili önceki kayıtlar ve önceki engelleri aşma girişimleri nedeniyle mevcut IP/cihaz engeliniz şimdilik devam etmektedir.

Yeniden değerlendirme talebinizi iletmek isterseniz aşağıdaki form üzerinden açıklamalarınızı gönderebilirsiniz:

${FORM_URL}

Formu göndermek, engelinizin kaldırılacağını garanti etmez. Başvurunuz mevcut kayıtlar ve açıklamalarınız doğrultusunda değerlendirilecektir.

Saygılarımızla,
RedChat Yönetimi`;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [{
          email: RECIPIENT_EMAIL,
          name: RECIPIENT_NAME
        }],
        subject: "RedChat | Ban İtirazınız Hakkında Son Değerlendirme",
        textContent,
        htmlContent: createEmailHTML(),
        tags: ["RedChat", "Ban-Itiraz"]
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Brevo yanıtı:", response.status, data);
      status = {
        state: "error",
        message: `Brevo gönderimi kabul etmedi (HTTP ${response.status}). Ayrıntılar Replit konsolunda.`
      };
      return;
    }

    console.log("Brevo isteği kabul etti. Mesaj ID:", data.messageId);
    status = {
      state: "accepted",
      message: "Brevo e-posta isteğini kabul etti. Gelen kutusuna teslim edildiği henüz doğrulanmadı.",
      messageId: data.messageId || null
    };
  } catch (error) {
    console.error("Gönderim hatası:", error);
    status = {
      state: "error",
      message: "Bağlantı hatası oluştu. Replit konsolunu kontrol et."
    };
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/status") {
    return sendJSON(res, 200, status);
  }

  if (req.method === "GET" && url.pathname === "/") {
    return fs.readFile(path.join(__dirname, "index.html"), (err, content) => {
      if (err) {
        return sendJSON(res, 500, { message: "index.html dosyası bulunamadı." });
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      });
      res.end(content);
    });
  }

  return sendJSON(res, 404, { message: "Sayfa bulunamadı." });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`RedChat Mail çalışıyor. Port: ${PORT}`);
  sendEmailOnce();
});

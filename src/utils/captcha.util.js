import https from "https";
import querystring from "querystring";

export function verifyCaptcha(token, remoteIp = null) {
  return new Promise((resolve, reject) => {
    if (!token) return resolve({ success: false, message: "No captcha token" });
    const secret = process.env.CAPTCHA_SECRET_KEY;
    if (!secret)
      return resolve({
        success: true,
        message: "No captcha secret configured",
      });

    const postData = querystring.stringify({
      secret,
      response: token,
      remoteip: remoteIp || "",
    });

    const options = {
      hostname: "www.google.com",
      path: "/recaptcha/api/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          // parsed: { success: true/false, score, action, hostname, 'error-codes': [] }
          if (!parsed.success) {
            // Log full parsed response for debugging (token invalid, domain mismatch, etc.)
            console.warn("[Captcha] verification failed:", parsed);
            resolve({ success: false, parsed });
          } else {
            resolve({ success: true, parsed });
          }
        } catch (err) {
          resolve({ success: false, message: "Invalid captcha response", err });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ success: false, message: "Captcha request error", e });
    });

    req.write(postData);
    req.end();
  });
}

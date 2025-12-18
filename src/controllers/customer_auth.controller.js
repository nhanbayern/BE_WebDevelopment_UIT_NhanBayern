import * as customerAuthService from "../services/customer_auth.service.js";
import { onLoginSuccess } from "../services/login.service.js";

const normalizeOrigin = (value) =>
  value ? value.trim().replace(/\/$/, "") : null;

function resolveCallbackTargetOrigin(req) {
  const queryOrigin = normalizeOrigin(req.query.origin || req.query.stateOrigin);
  if (queryOrigin) return queryOrigin;

  const configured = [
    process.env.REMOTE_ORIGIN,
    process.env.FRONTEND_ORIGIN,
    process.env.PUBLIC_ORIGIN,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  return configured[0] || "*";
}

// Đăng nhập customer bằng password
export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const result = await customerAuthService.loginWithPassword(
      email,
      password,
      ip,
      userAgent
    );
    if (result.success === false) {
      return res.status(401).json({ success: false, message: result.message });
    }
    // Create refresh token session and login_log (with session_id)
    // Note: account_id parameter is deprecated but kept for backward compatibility
    const onLogin = await onLoginSuccess(
      result.user,
      res,
      ip,
      userAgent,
      null, // account_id no longer used
      email
    );
    return res
      .status(200)
      .json({ success: true, message: "Đăng nhập thành công", ...onLogin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Đăng nhập callback google
export const googleLoginCallback = async (req, res) => {
  try {
    // req.user được gắn qua passport-google
    const userGoogle = req.user;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const result = await customerAuthService.loginWithGoogle(
      userGoogle.google_id,
      userGoogle.email,
      userGoogle.username,
      ip,
      userAgent
    );
    if (result.success === false) {
      const payload = { success: false, message: result.message };
      const targetOrigin = resolveCallbackTargetOrigin(req);
      // Send a tiny HTML page which will postMessage to opener and close
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>OAuth Result</title></head><body>
        <script>
          try{
            const payload = ${JSON.stringify(payload)};
            const target = ${JSON.stringify(targetOrigin)};
            if (window.opener) {
              try{ window.opener.postMessage(payload, target); } catch(e){ window.opener.postMessage(payload, '*'); }
            }
          }catch(e){}
          window.close();
        </script>
      </body></html>`);
    }
    // Create refresh token session and login_log (with session_id)
    const onLogin = await onLoginSuccess(
      result.user,
      res,
      ip,
      userAgent,
      null, // account_id no longer used
      userGoogle.email
    );
    const payload = {
      success: true,
      message: "Đăng nhập Google thành công",
      accessToken: onLogin.accessToken,
      user: onLogin.user,
      session_id: onLogin.session_id,
    };
    const targetOrigin = resolveCallbackTargetOrigin(req);
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>OAuth Result</title></head><body>
      <script>
        try{
          const payload = ${JSON.stringify(payload)};
          const target = ${JSON.stringify(targetOrigin)};
          if (window.opener) {
            try{ window.opener.postMessage(payload, target); } catch(e){ window.opener.postMessage(payload, '*'); }
          }
        }catch(e){}
        window.close();
      </script>
    </body></html>`);
  } catch (err) {
    console.error("Google callback error:", err);
    const payload = { success: false, message: err.message || "Server error" };
    const targetOrigin = resolveCallbackTargetOrigin(req);
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>OAuth Error</title></head><body>
      <script>
        try{
          const payload = ${JSON.stringify(payload)};
          const target = ${JSON.stringify(targetOrigin)};
          if (window.opener) {
            try{ window.opener.postMessage(payload, target); } catch(e){ window.opener.postMessage(payload, '*'); }
          }
        }catch(e){}
        window.close();
      </script>
    </body></html>`);
  }
};

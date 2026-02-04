/**
 * POST /api/login
 * Body: { user, pass }
 * Returns: { token } if valid, 401 otherwise
 */
export async function onRequestPost({ request, env }) {
    try {
        const { user, pass } = await request.json();

        // Validar credenciales desde variables de entorno
        if (user === env.ADMIN_USER && pass === env.ADMIN_PASS) {
            // Crear un token firmado simple (HMAC)
            // Payload: timestamp + user
            const payload = JSON.stringify({
                sub: user,
                iat: Date.now(),
            });

            const signature = await sign(payload, env.TOKEN_SECRET);
            // Formato token: payload_en_base64 + "." + firma_en_hex
            const token = btoa(payload) + "." + signature;

            return new Response(JSON.stringify({ token }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response("Unauthorized", { status: 401 });
    } catch (err) {
        return new Response("Bad Request", { status: 400 });
    }
}

// Helper: Firmar con HMAC SHA-256
async function sign(message, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(message)
    );
    return buf2hex(sig);
}

function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * GET /api/rsvp -> Lista todos los registros (Requiere Auth header)
 * POST /api/rsvp -> Guarda un nuevo registro
 */
export async function onRequestGet({ request, env }) {
    // 1. Verificar Auth
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
        return new Response("Missing token", { status: 401 });
    }
    const token = auth.split(" ")[1];
    const isValid = await verifyToken(token, env.TOKEN_SECRET);
    if (!isValid) {
        return new Response("Invalid token", { status: 403 });
    }

    // 2. Consultar D1
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM rsvps ORDER BY createdAt DESC"
        ).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Validación básica backend
        if (!data.name || !data.places) {
            return new Response("Invalid data", { status: 400 });
        }

        // Insertar en D1
        // id, createdAt, nameFull, nameTicket, adults, kids, places, userAgent
        const stmt = env.DB.prepare(
            `INSERT INTO rsvps (id, createdAt, nameFull, nameTicket, adults, kids, places, userAgent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const userAgent = request.headers.get("User-Agent") || "Unknown";

        await stmt.bind(
            data.id,
            data.createdAt,
            data.nameFull, // Se asume que script.js enviará esto
            data.name,     // ticket name
            data.adults,
            data.kids,
            data.places,
            userAgent
        ).run();

        return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Helpers Auth
async function verifyToken(token, secret) {
    try {
        const [b64Payload, signature] = token.split(".");
        if (!b64Payload || !signature) return false;

        const payloadStr = atob(b64Payload);
        // Verificar firma recreándola
        const expectedSig = await sign(payloadStr, secret);

        if (signature !== expectedSig) return false;

        // Verificar expiración (opcional, ej. 24h)
        // const p = JSON.parse(payloadStr);
        // if (Date.now() - p.iat > 86400000) return false;

        return true;
    } catch {
        return false;
    }
}

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

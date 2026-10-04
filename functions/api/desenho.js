import { gerarDesenho } from '../../lib/desenho.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Verificar Método HTTP (Erro 405)
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
    });
  }

  // 2. Validar Corpo da Requisição (Erro 400)
  let numero;
  try {
    const body = await request.json();
    if (!body || typeof body.numero === 'undefined') {
      return new Response(JSON.stringify({ error: 'Número ausente' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    numero = body.numero;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validar se o número é inteiro e está entre 1 e 100 (Erro 400)
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return new Response(JSON.stringify({ error: 'Número fora do intervalo (1-100)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Validar Token de Autenticação (Erro 401)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Token ausente ou mal formatado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    // Chamar a API do Google para validar o token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!googleRes.ok) {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenPayload = await googleRes.json();
    const expectedClientId = env.GOOGLE_CLIENT_ID;

    // Verificar se o "aud" corresponde ao teu Client ID e se o e-mail foi verificado
    if (tokenPayload.aud !== expectedClientId || (tokenPayload.email_verified !== true && tokenPayload.email_verified !== 'true')) {
      return new Response(JSON.stringify({ error: 'Não autorizado ou e-mail não verificado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Sucesso (200): Gerar SVG assinado com o e-mail do utilizador autenticado
    const emailAssinatura = tokenPayload.email;
    const svgContent = gerarDesenho(numero, emailAssinatura);

    return new Response(svgContent, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro ao validar o token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
const { createHash, timingSafeEqual } = require('node:crypto');

function criarAutenticacao(env = process.env) {
  const user = env.AUTH_USER || 'minecoord';
  const password = env.AUTH_PASSWORD || '';
  const host = env.HOST || '127.0.0.1';
  if (password && (password.length < 16 || user.includes(':'))) {
    throw new Error('AUTH_PASSWORD precisa de pelo menos 16 caracteres e AUTH_USER não pode conter dois-pontos.');
  }
  if (!password && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('Configure AUTH_PASSWORD com pelo menos 16 caracteres para permitir acesso pela rede.');
  }
  const digest = value => createHash('sha256').update(value).digest();
  const expected = digest(`${user}:${password}`);
  return (req, res, next) => {
    if (!password) return next();
    res.setHeader('Cache-Control', 'no-store');
    const header = req.headers.authorization || '';
    const supplied = /^Basic [A-Za-z0-9+/]+=*$/i.test(header)
      ? Buffer.from(header.slice(6), 'base64').toString('utf8') : '';
    if (timingSafeEqual(expected, digest(supplied))) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="minecoord", charset="UTF-8"');
    return res.status(401).json({ error: 'Autenticação necessária.' });
  };
}
module.exports = { criarAutenticacao };

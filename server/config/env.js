export function readRuntimeConfig(env = process.env) {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('PORT must be an integer between 1024 and 65535.');
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return {
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    port,
    cookieSecure: env.COOKIE_SECURE !== 'false',
  };
}

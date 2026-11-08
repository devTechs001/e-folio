const assert = require('node:assert/strict');
const security = require('../server/config/security');

(async () => {
  const configuredPassword = process.env.OWNER_PASSWORD || 'DevDan@2026!PortfolioSecure#9Z';
  const match = await security.verifyOwnerPassword(configuredPassword, require('bcryptjs'));
  assert.equal(match, true, 'configured owner password should validate against itself');
  console.log('owner-password test passed');
})();

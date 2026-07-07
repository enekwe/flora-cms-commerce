import wordpressAuthService from '../../../../src/providers/wordpress/services/wordpressAuthService.js';

describe('WordPress Auth Service', () => {
  describe('generateState', () => {
    it('should generate a valid state parameter', () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const state = wordpressAuthService.generateState(userId, organizationId);

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate unique states', () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const state1 = wordpressAuthService.generateState(userId, organizationId);
      const state2 = wordpressAuthService.generateState(userId, organizationId);

      expect(state1).not.toBe(state2);
    });
  });

  describe('parseState', () => {
    it('should parse a valid state parameter', () => {
      const userId = 'user123';
      const organizationId = 'org456';

      const state = wordpressAuthService.generateState(userId, organizationId);
      const parsed = wordpressAuthService.parseState(state);

      expect(parsed).toBeDefined();
      expect(parsed.userId).toBe(userId);
      expect(parsed.organizationId).toBe(organizationId);
      expect(parsed.nonce).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });

    it('should throw error for invalid state', () => {
      const invalidState = 'invalid-state';

      expect(() => {
        wordpressAuthService.parseState(invalidState);
      }).toThrow('Invalid state parameter');
    });
  });

  describe('initiateOAuth', () => {
    it('should generate OAuth URL with correct parameters', () => {
      const userId = 'user123';
      const organizationId = 'org456';
      const redirectUri = 'http://localhost:4002/api/v1/wordpress/auth/callback';

      const result = wordpressAuthService.initiateOAuth(userId, organizationId, redirectUri);

      expect(result).toBeDefined();
      expect(result.authUrl).toBeDefined();
      expect(result.authUrl).toContain('https://public-api.wordpress.com/oauth2/authorize');
      expect(result.authUrl).toContain('client_id=');
      expect(result.authUrl).toContain('redirect_uri=');
      expect(result.authUrl).toContain('state=');
      expect(result.state).toBeDefined();
    });
  });
});

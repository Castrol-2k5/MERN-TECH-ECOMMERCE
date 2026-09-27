import { authorize, scopeBranch } from '../../src/middlewares/rbac.middleware.js';
import { USER_ROLES } from '../../src/modules/users/user.model.js';
import { jest } from '@jest/globals';

describe('RBAC & Branch Scoping Middleware Unit Tests', () => {
  describe('authorize Middleware', () => {
    test('Happy Path: should call next() when user has the permitted role', () => {
      // Arrange
      const middleware = authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER);
      const req = { user: { role: USER_ROLES.SUPER_ADMIN } };
      const res = {};
      const next = jest.fn();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // called with no arguments (no error)
    });

    test('Negative Path: should block lower role with HTTP 403 FORBIDDEN', () => {
      // Arrange
      const middleware = authorize(USER_ROLES.SUPER_ADMIN);
      const req = { user: { role: USER_ROLES.CUSTOMER } };
      const res = {};
      const next = jest.fn();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
    });

    test('Negative Path: should block STAFF when endpoint is ADMIN only', () => {
      // Arrange
      const middleware = authorize(USER_ROLES.SUPER_ADMIN);
      const req = { user: { role: USER_ROLES.STAFF } };
      const res = {};
      const next = jest.fn();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
    });

    test('Negative Path: should fail with 401 when req.user is missing', () => {
      // Arrange
      const middleware = authorize(USER_ROLES.STAFF);
      const req = {};
      const res = {};
      const next = jest.fn();

      // Act
      middleware(req, res, next);

      // Assert
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('scopeBranch Middleware', () => {
    const branchA = '650c1f2e1234567890aaaaaa';
    const branchB = '650c1f2e1234567890bbbbbb';

    test('Happy Path: should automatically scope branchId for STAFF', () => {
      // Arrange
      const req = {
        user: { role: USER_ROLES.STAFF, branchId: branchA },
        query: {},
        body: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      scopeBranch(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(req.scopedBranchId).toBe(branchA);
      expect(req.query.branchId).toBe(branchA);
    });

    test('Security / Edge Case: should override spoofed query branchId for STAFF', () => {
      // Arrange: Staff from branch A attempts to query data of branch B
      const req = {
        user: { role: USER_ROLES.STAFF, branchId: branchA },
        query: { branchId: branchB },
        body: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      scopeBranch(req, res, next);

      // Assert: Spoofed branchId is forcefully overwritten to branch A
      expect(next).toHaveBeenCalledWith();
      expect(req.scopedBranchId).toBe(branchA);
      expect(req.query.branchId).toBe(branchA);
    });

    test('Happy Path: should allow SUPER_ADMIN to query specific branch across system', () => {
      // Arrange
      const req = {
        user: { role: USER_ROLES.SUPER_ADMIN, branchId: null },
        query: { branchId: branchB },
        body: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      scopeBranch(req, res, next);

      // Assert: Super admin preserves branch B query
      expect(next).toHaveBeenCalledWith();
      expect(req.scopedBranchId).toBe(branchB);
    });

    test('Negative Path: should fail with 403 when STAFF has no assigned branchId', () => {
      // Arrange
      const req = {
        user: { role: USER_ROLES.STAFF, branchId: null },
        query: {},
        body: {}
      };
      const res = {};
      const next = jest.fn();

      // Act
      scopeBranch(req, res, next);

      // Assert
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('BRANCH_NOT_ASSIGNED');
    });
  });
});

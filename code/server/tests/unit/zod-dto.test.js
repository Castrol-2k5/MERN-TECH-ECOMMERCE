import { registerSchema, loginSchema } from '../../src/modules/auth/auth.dto.js';

describe('Auth DTO Validation Unit Tests (Zod)', () => {
  describe('registerSchema', () => {
    test('Happy Path: should validate successfully with valid register data', () => {
      // Arrange
      const validPayload = {
        fullName: 'Nguyen Van A',
        email: 'nguyenvana@gmail.com',
        phone: '0912345678',
        password: 'password123'
      };

      // Act
      const result = registerSchema.parse(validPayload);

      // Assert
      expect(result.fullName).toBe('Nguyen Van A');
      expect(result.email).toBe('nguyenvana@gmail.com');
      expect(result.phone).toBe('0912345678');
      expect(result.password).toBe('password123');
    });

    test('Happy Path: should validate successfully with +84 phone prefix', () => {
      // Arrange
      const validPayload = {
        fullName: 'Tran Thi B',
        email: 'tranthib@gmail.com',
        phone: '+84987654321',
        password: 'securePassword!'
      };

      // Act
      const result = registerSchema.parse(validPayload);

      // Assert
      expect(result.phone).toBe('+84987654321');
    });

    test('Security / Edge Case: should strictly reject role injection', () => {
      // Arrange
      const maliciousPayload = {
        fullName: 'Hacker User',
        email: 'hacker@gmail.com',
        phone: '0912345678',
        password: 'password123',
        role: 'SUPER_ADMIN'
      };

      // Act & Assert
      expect(() => registerSchema.parse(maliciousPayload)).toThrow();
      try {
        registerSchema.parse(maliciousPayload);
      } catch (error) {
        expect(error.issues[0]?.message).toContain('Tuyệt đối không được chỉ định role');
      }
    });

    test('Negative Path: should fail when phone number is not a valid Vietnamese mobile format', () => {
      // Arrange
      const invalidPhonePayload = {
        fullName: 'Le Van C',
        email: 'levanc@gmail.com',
        phone: '01234567', // Invalid length / prefix
        password: 'password123'
      };

      // Act & Assert
      expect(() => registerSchema.parse(invalidPhonePayload)).toThrow();
    });

    test('Negative Path: should fail when password is shorter than 6 characters', () => {
      // Arrange
      const shortPasswordPayload = {
        fullName: 'Pham Van D',
        email: 'phamvand@gmail.com',
        phone: '0912345678',
        password: '12345'
      };

      // Act & Assert
      expect(() => registerSchema.parse(shortPasswordPayload)).toThrow();
      try {
        registerSchema.parse(shortPasswordPayload);
      } catch (error) {
        expect(error.issues[0]?.message).toContain('Mật khẩu tối thiểu 6 ký tự');
      }
    });

    test('Negative Path: should fail when email format is invalid', () => {
      // Arrange
      const invalidEmailPayload = {
        fullName: 'Hoang Van E',
        email: 'not-an-email',
        phone: '0912345678',
        password: 'password123'
      };

      // Act & Assert
      expect(() => registerSchema.parse(invalidEmailPayload)).toThrow();
      try {
        registerSchema.parse(invalidEmailPayload);
      } catch (error) {
        expect(error.issues[0]?.message).toContain('Email không đúng định dạng');
      }
    });
  });

  describe('loginSchema', () => {
    test('Happy Path: should validate successfully when identifier is an email', () => {
      // Arrange
      const payload = {
        identifier: 'customer@gmail.com',
        password: 'password123'
      };

      // Act
      const result = loginSchema.parse(payload);

      // Assert
      expect(result.identifier).toBe('customer@gmail.com');
      expect(result.password).toBe('password123');
    });

    test('Happy Path: should validate successfully when identifier is a Vietnamese phone number', () => {
      // Arrange
      const payload = {
        identifier: '0987654321',
        password: 'password123'
      };

      // Act
      const result = loginSchema.parse(payload);

      // Assert
      expect(result.identifier).toBe('0987654321');
    });

    test('Negative Path: should fail when identifier is neither valid email nor VN phone', () => {
      // Arrange
      const invalidIdentifier = {
        identifier: 'random_text_123',
        password: 'password123'
      };

      // Act & Assert
      expect(() => loginSchema.parse(invalidIdentifier)).toThrow();
    });

    test('Negative Path: should fail when password is empty', () => {
      // Arrange
      const emptyPassword = {
        identifier: 'customer@gmail.com',
        password: ''
      };

      // Act & Assert
      expect(() => loginSchema.parse(emptyPassword)).toThrow();
    });
  });
});

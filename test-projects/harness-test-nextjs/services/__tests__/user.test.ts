import { UserService } from '../user';
import type { User, ApiResponse } from '../../types/user';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('getUserById', () => {
    it('should return user data for valid ID', async () => {
      const user = await service.getUserById('1');

      expect(user).not.toBeNull();
      expect(user).toEqual({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: expect.any(Date),
      });
    });

    it('should return null for invalid ID', async () => {
      const user = await service.getUserById('999');

      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with generated ID and timestamp', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
      };

      const user = await service.createUser(userData);

      expect(user).toEqual({
        id: expect.any(String),
        name: 'New User',
        email: 'new@example.com',
        createdAt: expect.any(Date),
      });

      expect(user.id).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should assign unique IDs to different users', async () => {
      const user1 = await service.createUser({ name: 'User1', email: 'user1@example.com' });
      const user2 = await service.createUser({ name: 'User2', email: 'user2@example.com' });

      expect(user1.id).not.toBe(user2.id);
    });
  });
});
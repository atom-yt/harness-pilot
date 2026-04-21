import type { User } from '@/types/user';

export class UserService {
  async getUserById(id: string): Promise<User | null> {
    // Simulated database call
    if (id === '1') {
      return {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date()
      };
    }
    return null;
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return {
      id: Math.random().toString(36),
      ...data,
      createdAt: new Date()
    };
  }
}
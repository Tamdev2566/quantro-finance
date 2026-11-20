import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';

class AuthService {
  getAllUsers() {
    return jsonStore.readSync('users.json') || [];
  }

  login({ email, password }) {
    const users = this.getAllUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Find matching user
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password. Please verify credentials.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Invalid password provided.');
    }

    // Log the successful login in audit log
    auditService.log({
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      user: user.name
    });

    // Return user without password
    const { password: _, ...safeUser } = user;
    return {
      user: safeUser,
      token: `apex-token-${user.id}-${Date.now()}`
    };
  }

  getUserById(id) {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}

export default new AuthService();

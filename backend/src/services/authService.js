import jsonStore from '../storage/jsonStore.js';
import auditService from './auditService.js';

class AuthService {
  getAllUsers() {
    return jsonStore.readSync('users.json') || [];
  }

  login({ email, password }) {
    const users = this.getAllUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password. Please verify credentials.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Invalid password provided.');
    }

    auditService.log({
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      user: user.name
    });

    const { password: _, ...safeUser } = user;
    return {
      user: safeUser,
      token: `apex-token-${user.id}-${Date.now()}`
    };
  }

  changePassword({ email, currentPassword, newPassword }) {
    const users = this.getAllUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      throw new Error('User account not found.');
    }

    const user = users[userIndex];
    if (user.password && user.password !== currentPassword) {
      throw new Error('Current password is incorrect.');
    }

    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    user.password = newPassword.trim();
    users[userIndex] = user;
    jsonStore.writeSync('users.json', users);

    auditService.log({
      action: 'PASSWORD_CHANGED',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
      user: user.name
    });

    return { message: 'Password updated successfully' };
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

const API_URL = 'https://backend-giahung.onrender.com/api';

export const apiService = {
  async login(credentials) {
    try {
      // Log request
      console.log('Login request:', {
        url: `${API_URL}/auth/login`,
        body: credentials
      });

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      console.log('Login response:', result);
      
      if (result.status === 'success') {
        // Lưu thông tin ngay tại đây
        localStorage.setItem('token', result.tokens.accessToken);
        localStorage.setItem('userName', result.user.name);
        localStorage.setItem('userRole', result.user.role);
        localStorage.setItem('userId', result.user.id);
        
        console.log('Stored user info:', {
          token: result.tokens.accessToken,
          name: result.user.name,
          role: result.user.role,
          id: result.user.id
        });
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      console.log('Register request:', {
        url: `${API_URL}/auth/register`,
        body: userData
      });

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      console.log('Register response:', data);
      return data;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  },

  async getProducts() {
    const response = await fetch(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  async verifyToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_URL}users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (err) {
      return false;
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      console.log('Token for getCurrentUser:', token); // Debug token

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user data');
      }

      const data = await response.json();
      console.log('Get user response:', data);
      return data;
    } catch (err) {
      console.error('Get user error:', err);
      throw err;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data = await response.json();
      console.log('Refresh token response:', data);
      return data;
    } catch (err) {
      console.error('Refresh token error:', err);
      throw err;
    }
  }
}; 
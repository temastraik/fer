import { supabase } from '../supabaseClient';

/**
 * Сервис для работы с аутентификацией пользователей
 */
export const AuthService = {
  /**
   * Выполняет вход пользователя по email и паролю
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль пользователя
   * @returns {Promise<{data: object|null, error: Error|null}>} Результат операции
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      return { data, error };
    } catch (error) {
      console.error('Ошибка в AuthService.login:', error.message);
      return { data: null, error };
    }
  }
};
import { supabase } from '../supabaseClient';

/**
 * Сервис для работы с аутентификацией
 */
export const AuthService = {
  /**
   * Отправляет запрос на восстановление пароля
   * @param {string} email - Email пользователя
   * @param {string} redirectTo - URL для перенаправления после сброса пароля
   * @returns {Promise<{error: Error|null}>} Объект с ошибкой (если есть)
   */
  async requestPasswordReset(email, redirectTo) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      return { error };
    } catch (error) {
      console.error('Ошибка в AuthService.requestPasswordReset:', error.message);
      return { error };
    }
  }
};
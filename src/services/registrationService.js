// src/services/authService.js
import { supabase } from '../supabaseClient';

/**
 * Загружает список регионов из базы данных
 * @returns {Promise<Array>} Массив регионов
 */
export const fetchRegions = async () => {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('id, name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Ошибка при загрузке регионов:', error.message);
    throw error;
  }
};

/**
 * Регистрирует нового пользователя
 * @param {Object} userData - Данные пользователя для регистрации
 * @returns {Promise<void>}
 */
export const registerUser = async (userData) => {
  try {
    // Регистрация пользователя через Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });
    
    if (authError) throw authError;
    
    console.log('Данные авторизации:', authData);
    
    // Проверка, что пользователь успешно создан
    if (!authData?.user || !authData.user.id) {
      throw new Error('Не удалось создать пользователя');
    }
    
    // Сохранение дополнительных данных пользователя в таблицу users
    const profileData = {
      id: authData.user.id,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role,
      region_id: userData.region_id ? parseInt(userData.region_id) : null,
      bio: userData.bio,
      created_at: new Date()
    };
    
    console.log('Данные пользователя для сохранения:', profileData);
    
    const { error: profileError } = await supabase
      .from('users')
      .insert([profileData]);
      
    if (profileError) {
      console.error('Ошибка при сохранении профиля:', profileError);
      
      // Если произошла ошибка при сохранении профиля, удаляем созданного пользователя
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      throw new Error(`Ошибка при сохранении профиля: ${profileError.message}`);
    }
    
    return authData;
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw error;
  }
};
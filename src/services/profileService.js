// src/services/profileService.js
import { supabase } from '../supabaseClient';

/**
 * Получает данные текущего пользователя
 * @returns {Promise<Object|null>} Данные пользователя или null
 */
export const fetchUserProfile = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

/**
 * Получает профиль пользователя по ID
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object|null>} Профиль пользователя или null
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      role,
      region_id,
      bio,
      created_at,
      regions(name)
    `)
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

/**
 * Создает новый профиль пользователя
 * @param {Object} profileData - Данные для создания профиля
 * @returns {Promise<Object>} Созданный профиль
 */
export const createUserProfile = async (profileData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([profileData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Обновляет профиль пользователя
 * @param {string} userId - ID пользователя
 * @param {Object} updates - Обновляемые поля
 * @returns {Promise<Object>} Обновленный профиль
 */
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Получает список регионов
 * @returns {Promise<Array>} Массив регионов
 */
export const fetchRegions = async () => {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name');
    
  if (error) throw error;
  return data || [];
};
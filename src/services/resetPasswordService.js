// src/services/resetPasswordService.js

import { supabase } from '../supabaseClient';

// Проверка наличия активной сессии пользователя
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data;
};

// Обновление пароля пользователя
export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
};
// src/services/teamApplicationService.js

import { supabase } from '../supabaseClient';

// Загрузка команд, где текущий пользователь является капитаном
export const fetchUserTeams = async (userId) => {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .eq('captain_user_id', userId);

  if (error) throw error;
  return data || [];
};

// Проверка, подана ли уже заявка на соревнование от этой команды
export const checkExistingApplication = async (competitionId, teamId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('competition_id', competitionId)
    .eq('applicant_team_id', teamId)
    .single();

  // Если ошибка отличная от "нет записей", пробрасываем её
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

// Подача новой заявки на соревнование
export const submitTeamApplication = async (applicationData) => {
  const { error } = await supabase
    .from('applications')
    .insert([applicationData]);

  if (error) throw error;
};
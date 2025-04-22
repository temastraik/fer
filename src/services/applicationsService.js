import { supabase } from '../supabaseClient';

export const ApplicationsService = {
  // Получение текущего пользователя
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },

  // Получение данных соревнования
  fetchCompetition: async (competitionId) => {
    const { data, error } = await supabase
      .from('competitions')
      .select(`
        *,
        disciplines(name),
        regions(name)
      `)
      .eq('id', competitionId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Получение заявок на соревнование
  fetchApplications: async (competitionId) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        application_type,
        applicant_user_id,
        applicant_team_id,
        status,
        submitted_at,
        users!applicant_user_id(id, full_name, email),
        teams!applicant_team_id(id, name, captain_user_id, users!captain_user_id(full_name, email))
      `)
      .eq('competition_id', competitionId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Обновление статуса заявки
  updateApplicationStatus: async (applicationId, newStatus) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);
    
    if (error) throw error;
  },

  // Проверка прав организатора
  checkOrganizerRights: (competition, user) => {
    if (competition.organizer_user_id !== user.id) {
      throw new Error('У вас нет прав для управления заявками на это соревнование');
    }
  }
};
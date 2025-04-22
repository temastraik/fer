import { supabase } from '../supabaseClient';

/**
 * Сервис для работы с соревнованиями
 */
export const CompetitionService = {
  // Получение данных соревнования по ID
  async getCompetitionById(id) {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },

  // Обновление данных соревнования
  async updateCompetition(id, competitionData) {
    const { error } = await supabase
      .from('competitions')
      .update({
        ...competitionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
  },

  // Удаление соревнования
  async deleteCompetition(id) {
    // Проверяем наличие активных заявок
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('competition_id', id);
      
    if (applicationsError) throw applicationsError;
    
    const activeApplications = applications?.filter(app => 
      app.status !== 'отклонена' && app.status !== 'отменена'
    );
    
    if (activeApplications?.length > 0) {
      throw new Error(`У соревнования есть ${activeApplications.length} активных заявок. Сначала нужно отклонить или отменить все заявки.`);
    }
    
    // Удаляем все заявки, связанные с соревнованием
    if (applications?.length > 0) {
      const { error: deleteApplicationsError } = await supabase
        .from('applications')
        .delete()
        .eq('competition_id', id);
        
      if (deleteApplicationsError) throw deleteApplicationsError;
    }
    
    // Удаляем соревнование
    const { error: deleteError } = await supabase
      .from('competitions')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
  },

  // Получение списка дисциплин
  async getDisciplines() {
    const { data, error } = await supabase
      .from('disciplines')
      .select('id, name');
      
    if (error) throw error;
    return data || [];
  },

  // Получение списка регионов
  async getRegions() {
    const { data, error } = await supabase
      .from('regions')
      .select('id, name');
      
    if (error) throw error;
    return data || [];
  },

  // Проверка прав доступа пользователя
  async checkUserAccess(competitionId, userId) {
    const { data, error } = await supabase
      .from('competitions')
      .select('organizer_user_id')
      .eq('id', competitionId)
      .single();
      
    if (error) throw error;
    return data?.organizer_user_id === userId;
  }
};
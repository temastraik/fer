import { supabase } from '../supabaseClient';

// Сервис для работы с данными dashboard
export const DashboardService = {
  // Получение текущего пользователя
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },

  // Получение списка соревнований
  async getCompetitions() {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select(`
          id,
          name,
          description,
          type,
          status,
          registration_start_date,
          registration_end_date,
          start_date,
          end_date,
          disciplines(name)
        `)
        .order('registration_start_date', { ascending: false })
        .limit(6);
        
      if (error) throw error;
      
      // Форматирование данных для фронтенда
      return data.map(comp => ({
        ...comp,
        discipline_name: comp.disciplines?.name
      }));
    } catch (error) {
      console.error('Ошибка при загрузке соревнований:', error.message);
      throw error;
    }
  }
};
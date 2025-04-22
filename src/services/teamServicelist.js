import { supabase } from '../supabaseClient';

/**
 * Получает команды пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<{captainTeams: Array, memberTeams: Array}>}
 */
export const fetchUserTeams = async (userId) => {
  try {
    // Получаем команды, где пользователь является капитаном
    const { data: captainData, error: captainError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        created_at,
        team_members(id, user_id)
      `)
      .eq('captain_user_id', userId);
      
    if (captainError) throw captainError;
    
    // Форматируем команды капитана
    const captainTeams = captainData.map(team => ({
      ...team,
      memberCount: team.team_members?.length || 0,
      role: 'Капитан'
    }));
    
    // Получаем команды, где пользователь является участником
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        teams(
          id,
          name,
          created_at,
          captain_user_id,
          users(full_name, email)
        )
      `)
      .eq('user_id', userId);
      
    if (memberError) throw memberError;
    
    // Форматируем команды участника
    const memberTeams = memberData
      .map(item => item.teams)
      .filter(team => team && team.captain_user_id !== userId)
      .map(team => ({
        ...team,
        role: 'Участник',
        captain: team.users?.full_name || team.users?.email || 'Неизвестный капитан'
      }));
    
    return { captainTeams, memberTeams };
  } catch (error) {
    console.error('Ошибка при загрузке команд:', error.message);
    throw error;
  }
};

/**
 * Создает новую команду
 * @param {string} userId - ID пользователя (капитана)
 * @param {string} teamName - Название команды
 * @returns {Promise<Object>} - Созданная команда
 */
export const createNewTeam = async (userId, teamName) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          name: teamName,
          captain_user_id: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) throw error;
    
    return {
      ...data[0],
      memberCount: 0,
      role: 'Капитан'
    };
  } catch (error) {
    console.error('Ошибка при создании команды:', error.message);
    throw error;
  }
};
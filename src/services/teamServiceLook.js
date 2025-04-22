import { supabase } from '../supabaseClient';

/**
 * Получает команды, ищущие участников для указанного соревнования
 * @param {string} competitionId - ID соревнования
 * @param {string} userId - ID текущего пользователя
 * @returns {Promise<Array>} - Массив команд
 */
export const fetchTeamsLookingForMembers = async (competitionId, userId) => {
  try {
    // Получаем заявки со статусом 'формируется'
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        id,
        applicant_team_id,
        additional_data,
        competition_id,
        teams (
          id,
          name,
          captain_user_id,
          users!teams_captain_user_id_fkey (full_name, email)
        )
      `)
      .eq('competition_id', competitionId)
      .eq('status', 'формируется');

    if (applicationsError) throw applicationsError;
    if (!applicationsData || applicationsData.length === 0) return [];

    // Фильтруем команды, где пользователь не является участником
    const filteredTeams = [];
    for (const app of applicationsData) {
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', app.applicant_team_id);

      if (membersError) throw membersError;

      const isMember = membersData.some(member => member.user_id === userId);
      if (!isMember) filteredTeams.push(app);
    }

    return filteredTeams;
  } catch (err) {
    console.error('Ошибка в fetchTeamsLookingForMembers:', err.message);
    throw err;
  }
};

/**
 * Отправляет запрос на вступление в команду
 * @param {Object} params - Параметры запроса
 * @param {string} params.teamId - ID команды
 * @param {string} params.userId - ID пользователя
 * @param {string} params.competitionId - ID соревнования
 * @returns {Promise<void>}
 */
export const sendJoinRequest = async ({ teamId, userId, competitionId }) => {
  try {
    // Проверяем существующий запрос
    const { data: existingRequest, error: requestError } = await supabase
      .from('team_join_requests')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .single();

    if (requestError && requestError.code !== 'PGRST116') throw requestError;
    if (existingRequest) throw new Error('Запрос уже существует');

    // Создаем новый запрос
    const { error: insertError } = await supabase
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        user_id: userId,
        competition_id: competitionId,
        status: 'pending',
      });

    if (insertError) throw insertError;
  } catch (err) {
    console.error('Ошибка в sendJoinRequest:', err.message);
    throw err;
  }
};
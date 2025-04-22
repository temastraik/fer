import { supabase } from '../supabaseClient';

// Получение данных команды
export const fetchTeamData = async (teamId) => {
  try {
    // Получаем данные о команде
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        users(full_name, email)
      `)
      .eq('id', teamId)
      .single();
      
    if (teamError) throw teamError;
    
    // Загружаем участников команды
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        team_id,
        users(id, full_name, email)
      `)
      .eq('team_id', teamId);
      
    if (membersError) throw membersError;
    
    // Загружаем заявки на соревнования
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        application_type,
        submitted_at,
        competitions(id, name, start_date, end_date)
      `)
      .eq('applicant_team_id', teamId)
      .order('submitted_at', { ascending: false });
      
    if (appError) throw appError;
    
    return {
      teamData,
      membersData,
      appData
    };
    
  } catch (error) {
    console.error('Ошибка при загрузке данных команды:', error.message);
    throw error;
  }
};

// Получение запросов на вступление
export const fetchJoinRequests = async (teamId) => {
  try {
    const { data: requestsData, error: requestsError } = await supabase
      .from('team_join_requests')
      .select(`
        id,
        user_id,
        competition_id,
        status,
        created_at,
        users (full_name, email),
        competitions (name)
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');

    if (requestsError) throw requestsError;

    return requestsData || [];
  } catch (err) {
    console.error('Ошибка при загрузке запросов на вступление:', err.message);
    throw err;
  }
};

// Обработка запроса на вступление
export const handleRequestAction = async (requestId, action, teamId, joinRequests, teamMembers) => {
  try {
    // Обновляем статус запроса
    const { error: updateError } = await supabase
      .from('team_join_requests')
      .update({ status: action })
      .eq('id', requestId);

    if (updateError) throw updateError;

    if (action === 'accepted') {
      const request = joinRequests.find(req => req.id === requestId);
      if (request) {
        // Добавляем пользователя в команду
        const { data: memberData, error: insertError } = await supabase
          .from('team_members')
          .insert({ team_id: teamId, user_id: request.user_id })
          .select(`
            id,
            user_id,
            team_id,
            users(id, full_name, email)
          `);

        if (insertError) throw insertError;

        // Возвращаем обновленный список участников
        return [...teamMembers, memberData[0]];
      }
    }
    
    return null;
  } catch (err) {
    console.error('Ошибка при обработке запроса:', err.message);
    throw err;
  }
};

// Обновление названия команды
export const updateTeamName = async (teamId, newName) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({ name: newName })
      .eq('id', teamId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Ошибка при обновлении названия команды:', error.message);
    throw error;
  }
};

// Удаление участника команды
export const deleteTeamMember = async (memberId) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Ошибка при удалении участника:', error.message);
    throw error;
  }
};

// Удаление команды
export const deleteTeamService = async (teamId) => {
  try {
    // Удаляем участников команды
    const { error: membersError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);
      
    if (membersError) throw membersError;
    
    // Удаляем саму команду
    const { error: teamError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
      
    if (teamError) throw teamError;
  } catch (error) {
    console.error('Ошибка при удалении команды:', error.message);
    throw error;
  }
};

// Добавление участника в команду
export const addTeamMember = async (teamId, email, currentMembers, captainId) => {
  try {
    // Ищем пользователя по email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    if (userError) {
      throw new Error('Пользователь с email "' + email + '" не найден. Убедитесь, что пользователь зарегистрирован в системе.');
    }
    
    // Проверяем, не является ли пользователь уже участником команды
    const isAlreadyMember = currentMembers.some(member => member.user_id === userData.id);
    
    if (isAlreadyMember) {
      throw new Error('Этот пользователь уже является участником команды');
    }
    
    // Проверяем, не является ли пользователь капитаном
    if (userData.id === captainId) {
      throw new Error('Нельзя добавить капитана как участника команды');
    }
    
    // Добавляем пользователя в команду
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: teamId,
          user_id: userData.id
        }
      ])
      .select(`
        id,
        user_id,
        team_id,
        users(id, full_name, email)
      `);
      
    if (memberError) throw memberError;
    
    return memberData[0];
  } catch (error) {
    console.error('Ошибка при добавлении участника:', error.message);
    throw error;
  }
};
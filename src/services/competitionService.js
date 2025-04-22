import { supabase } from '../supabaseClient';

export const fetchInitialData = async () => {
  try {
    // Загрузка дисциплин
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('disciplines')
      .select('id, name');
      
    if (disciplinesError) throw disciplinesError;
    
    // Загрузка регионов
    const { data: regionsData, error: regionsError } = await supabase
      .from('regions')
      .select('id, name');
      
    if (regionsError) throw regionsError;
    
    return {
      disciplines: disciplinesData || [],
      regions: regionsData || []
    };
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error.message);
    throw error;
  }
};

export const ensureUserProfile = async (user) => {
  try {
    // Проверяем, существует ли пользователь в таблице users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (userError && userError.code === 'PGRST116') { // Код ошибки "не найдено"
      console.log('Профиль пользователя не найден, создаем новый');
      
      // Если пользователя нет в таблице users, добавляем его
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date()
          }
        ]);
        
      if (insertError) {
        console.error('Ошибка при создании профиля пользователя:', insertError);
        throw new Error('Не удалось создать профиль пользователя');
      }
    } else if (userError) {
      console.error('Ошибка при проверке профиля пользователя:', userError);
      throw userError;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при проверке/создании профиля:', error);
    throw error;
  }
};

export const createCompetition = async (competitionData, userId) => {
  try {
    // Проверка обязательных полей
    const requiredFields = [
      'name', 'discipline_id', 'type', 
      'registration_start_date', 'registration_end_date',
      'start_date', 'end_date'
    ];
    
    for (const field of requiredFields) {
      if (!competitionData[field]) {
        throw new Error(`Поле "${field}" обязательно для заполнения`);
      }
    }

    // Проверка авторизации и наличия ID пользователя
    if (!userId) {
      throw new Error('Сессия пользователя недействительна');
    }
    
    // Отправка данных в базу
    const { data, error } = await supabase
      .from('competitions')
      .insert([
        {
          name: competitionData.name,
          description: competitionData.description,
          discipline_id: competitionData.discipline_id,
          type: competitionData.type,
          region_id: competitionData.region_id === '' ? null : competitionData.region_id,
          registration_start_date: competitionData.registration_start_date,
          registration_end_date: competitionData.registration_end_date,
          start_date: competitionData.start_date,
          end_date: competitionData.end_date,
          max_participants_or_teams: competitionData.max_participants_or_teams || null,
          organizer_user_id: userId,
          status: competitionData.status,
          created_at: new Date().toISOString()
        }
      ])
      .select();
      
    if (error) {
      console.error('Ошибка при создании соревнования:', error);
      throw new Error(`Не удалось создать соревнование: ${error.message}`);
    }
    
    return data[0];
  } catch (error) {
    console.error('Ошибка при создании соревнования:', error.message);
    throw error;
  }
};

export const validateCompetitionDates = (competitionData) => {
  const regStart = new Date(competitionData.registration_start_date);
  const regEnd = new Date(competitionData.registration_end_date);
  const compStart = new Date(competitionData.start_date);
  const compEnd = new Date(competitionData.end_date);
  
  // Проверка наличия всех дат
  if (!competitionData.registration_start_date || !competitionData.registration_end_date || 
      !competitionData.start_date || !competitionData.end_date) {
    return null; // Не валидируем, если не все даты выбраны
  }
  
  // Проверка корректности дат
  if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime()) || 
      isNaN(compStart.getTime()) || isNaN(compEnd.getTime())) {
    return 'Введены некорректные даты';
  }
  
  if (regEnd <= regStart) {
    return 'Дата окончания регистрации должна быть позже даты начала регистрации';
  }
  
  if (compStart <= regStart) {
    return 'Дата начала соревнования должна быть позже даты начала регистрации';
  }
  
  if (compEnd <= compStart) {
    return 'Дата окончания соревнования должна быть позже даты начала соревнования';
  }
  
  return null;
};
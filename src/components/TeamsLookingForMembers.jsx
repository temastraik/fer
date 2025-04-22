import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { fetchTeamsLookingForMembers, sendJoinRequest } from '../services/teamServiceLook';

const TeamsLookingForMembers = ({ competitionId, currentUser }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestStatus, setRequestStatus] = useState({});

  // Загрузка команд, ищущих участников
  useEffect(() => {
    const loadTeams = async () => {
      if (!currentUser || !competitionId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const teamsData = await fetchTeamsLookingForMembers(competitionId, currentUser.id);
        setTeams(teamsData);
      } catch (err) {
        console.error('Ошибка при загрузке команд:', err.message);
        setError('Не удалось загрузить команды, ищущие участников.');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [competitionId, currentUser]);

  // Обработка запроса на вступление в команду
  const handleJoinRequest = async (teamId) => {
    try {
      setRequestStatus(prev => ({ ...prev, [teamId]: 'loading' }));
      
      await sendJoinRequest({
        teamId,
        userId: currentUser.id,
        competitionId
      });
      
      setRequestStatus(prev => ({ ...prev, [teamId]: 'success' }));
    } catch (err) {
      console.error('Ошибка при отправке запроса:', err.message);
      setRequestStatus(prev => ({ 
        ...prev, 
        [teamId]: err.message.includes('уже существует') 
          ? 'already_requested' 
          : 'error' 
      }));
    }
  };

  // Состояния загрузки и ошибок
  if (loading) return <div className="text-gray-400">Загрузка...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (teams.length === 0) return <div className="text-gray-400">Нет команд, ищущих участников.</div>;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4 text-white">Команды, ищущие участников</h2>
      <div className="divide-y divide-gray-700">
        {teams.map(team => {
          const { required_members, roles_needed } = JSON.parse(team.additional_data || '{}');
          const status = requestStatus[team.applicant_team_id];
          const isCaptain = team.teams.captain_user_id === currentUser.id;

          return (
            <div key={team.id} className="py-3">
              <h3 className="font-medium text-white">{team.teams.name}</h3>
              <p className="text-sm text-gray-400">
                Капитан: {team.teams.users?.full_name} ({team.teams.users?.email})
              </p>
              <p className="text-sm text-gray-400">
                Требуется участников: {required_members || 'Не указано'}
              </p>
              <p className="text-sm text-gray-400">
                Роли: {roles_needed || 'Не указано'}
              </p>
              {!isCaptain ? (
                <button
                  onClick={() => handleJoinRequest(team.applicant_team_id)}
                  disabled={status === 'loading' || status === 'success' || status === 'already_requested'}
                  className={`mt-2 px-4 py-2 rounded-md text-sm font-medium
                    ${status === 'success' || status === 'already_requested'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {status === 'loading' && 'Отправка...'}
                  {status === 'success' && 'Запрос отправлен'}
                  {status === 'already_requested' && 'Запрос уже отправлен'}
                  {status === 'error' && 'Ошибка, попробуйте снова'}
                  {!status && 'Отправить запрос на вступление'}
                </button>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Это ваша команда.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamsLookingForMembers;
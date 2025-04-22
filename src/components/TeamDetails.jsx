// src/components/TeamDetails.jsx
import { supabase } from '../supabaseClient';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { 
  fetchTeamData, 
  fetchJoinRequests, 
  handleRequestAction, 
  updateTeamName, 
  deleteTeamMember, 
  deleteTeamService, 
  addTeamMember 
} from '../services/teamService';

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  // Получение текущего пользователя
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    
    fetchUser();
  }, []);

  // Загрузка данных команды и запросов на вступление
  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Загружаем данные команды
        const { teamData, membersData, appData } = await fetchTeamData(id);
        setTeam(teamData);
        setTeamName(teamData.name);
        setTeamMembers(membersData);
        setApplications(appData);
        
        // Загружаем запросы на вступление
        const requestsData = await fetchJoinRequests(id);
        setJoinRequests(requestsData);
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error.message);
        setError(error.message || 'Не удалось загрузить данные команды. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user]);

  // Обработка запроса на вступление
  const handleRequest = async (requestId, action) => {
    try {
      setLoading(true);
      
      const updatedMembers = await handleRequestAction(
        requestId, 
        action, 
        id, 
        joinRequests, 
        teamMembers
      );
      
      if (updatedMembers) {
        setTeamMembers(updatedMembers);
      }
      
      setJoinRequests(joinRequests.filter(req => req.id !== requestId));
      alert(`Запрос ${action === 'accepted' ? 'принят' : 'отклонен'}!`);
    } catch (err) {
      console.error('Ошибка:', err.message);
      setError('Не удалось обработать запрос. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Проверка, является ли текущий пользователь капитаном команды
  const isTeamCaptain = () => {
    return team && user && team.captain_user_id === user.id;
  };

  // Сохранение изменений названия команды
  const saveTeamName = async () => {
    if (!teamName.trim() || !isTeamCaptain()) return;
    
    try {
      setLoading(true);
      
      const updatedTeam = await updateTeamName(id, teamName.trim());
      setTeam(updatedTeam);
      setIsEditing(false);
      alert('Название команды обновлено!');
      
    } catch (error) {
      console.error('Ошибка:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление участника из команды
  const removeMember = async (memberId, userId) => {
    if (!isTeamCaptain()) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этого участника из команды?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteTeamMember(memberId);
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      alert('Участник удален из команды!');
      
    } catch (error) {
      console.error('Ошибка:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление команды
  const deleteTeam = async () => {
    if (!isTeamCaptain()) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить команду? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (applications.some(app => 
        app.status !== 'отклонена' && app.status !== 'отменена'
      )) {
        throw new Error('Нельзя удалить команду с активными заявками на соревнования. Сначала отмените заявки.');
      }
      
      await deleteTeamService(id);
      alert('Команда успешно удалена!');
      navigate('/teams');
      
    } catch (error) {
      console.error('Ошибка:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Добавление нового участника
  const addMember = async () => {
    if (!isTeamCaptain() || !newMemberEmail.trim()) return;
  
    try {
      setAddMemberLoading(true);
      setAddMemberError(null);
      
      const newMember = await addTeamMember(id, newMemberEmail.trim(), teamMembers, team.captain_user_id);
      
      setTeamMembers([...teamMembers, newMember]);
      setShowAddMemberModal(false);
      setNewMemberEmail('');
      alert('Участник успешно добавлен в команду!');
      
    } catch (error) {
      console.error('Ошибка:', error.message);
      setAddMemberError(error.message);
    } finally {
      setAddMemberLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Показать индикатор загрузки
  if (loading && !team) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  // Показать сообщение об ошибке
  if (error && !team) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {team && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <div className="flex items-start">
                {isEditing ? (
                  <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Название команды"
                    />
                    <button
                      onClick={saveTeamName}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                      disabled={loading}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setTeamName(team.name);
                      }}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">{team.name}</h1>
                    {isTeamCaptain() && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-gray-400 hover:text-white transition"
                        title="Редактировать название"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <Link
                  to="/teams"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
                >
                  ← К списку команд
                </Link>
                
                {isTeamCaptain() && (
                  <button
                    onClick={deleteTeam}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                    disabled={loading}
                  >
                    Удалить команду
                  </button>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900 text-white rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Участники команды</h2>
                    {isTeamCaptain() && (
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm"
                      >
                        + Добавить участника
                      </button>
                    )}
                  </div>
                  
                  <div className="divide-y divide-gray-700">
                    {/* Капитан */}
                    <div className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium">{team.users?.full_name || team.users?.email}</span>
                        <span className="ml-2 px-2 py-0.5 bg-green-900 text-green-300 rounded-full text-xs">Капитан</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {team.users?.email}
                      </div>
                    </div>
                    
                    {/* Участники */}
                    {teamMembers.length > 0 ? (
                      teamMembers.map(member => (
                        <div key={member.id} className="py-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{member.users?.full_name || member.users?.email}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-400">{member.users?.email}</span>
                            {isTeamCaptain() && (
                              <button
                                onClick={() => removeMember(member.id, member.user_id)}
                                className="text-red-500 hover:text-red-400 transition"
                                title="Удалить участника"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-400">
                        В команде нет участников
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Новый раздел для запросов на вступление */}
                {isTeamCaptain() && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Запросы на вступление</h2>
                    {joinRequests.length === 0 ? (
                      <p className="text-gray-400">Нет запросов на вступление.</p>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {joinRequests.map(request => (
                          <div key={request.id} className="py-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {request.users?.full_name || request.users?.email}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Соревнование: {request.competitions?.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Дата запроса: {formatDate(request.created_at)}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleRequestAction(request.id, 'accepted')}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition text-sm"
                                  disabled={loading}
                                >
                                  Принять
                                </button>
                                <button
                                  onClick={() => handleRequestAction(request.id, 'rejected')}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition text-sm"
                                  disabled={loading}
                                >
                                  Отклонить
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Заявки на соревнования */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Заявки на соревнования</h2>
                  
                  {applications.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                      {applications.map(app => (
                        <div key={app.id} className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{app.competitions?.name || 'Соревнование'}</h3>
                              <div className="text-sm text-gray-400 mt-1">
                                {app.competitions?.start_date && (
                                  <span>Дата проведения: {formatDate(app.competitions.start_date)}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                app.status === 'одобрена' ? 'bg-green-900 text-green-300' :
                                app.status === 'на_рассмотрении' ? 'bg-yellow-900 text-yellow-300' :
                                app.status === 'отклонена' ? 'bg-red-900 text-red-300' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex justify-between text-sm text-gray-400">
                            <span>Подана: {formatDate(app.submitted_at)}</span>
                            {app.competitions && (
                              <Link
                                to={`/competitions/${app.competitions.id}`}
                                className="text-blue-500 hover:text-blue-400"
                              >
                                Подробнее
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      Нет заявок на соревнования
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                {/* Информация о команде */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Информация о команде</h2>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 mb-1">Капитан:</p>
                      <p>{team.users?.full_name || team.users?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-1">Дата создания:</p>
                      <p>{formatDate(team.created_at)}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-1">Количество участников:</p>
                      <p>{teamMembers.length + 1} (включая капитана)</p> {/* +1 для капитана */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Модальное окно добавления участника */}
            {showAddMemberModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 mx-4">
                  <h3 className="text-xl font-semibold mb-4">Добавить участника в команду</h3>
                  
                  {addMemberError && (
                    <div className="mb-4 p-3 bg-red-900 text-white rounded-md">
                      {addMemberError}
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <label className="block text-gray-300 mb-1">Email участника *</label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Введите email пользователя"
                      required
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      Пользователь должен быть зарегистрирован в системе с указанным email
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setNewMemberEmail('');
                        setAddMemberError(null);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
                    >
                      Отмена
                    </button>
                    
                    <button
                      onClick={addMember}
                      disabled={addMemberLoading || !newMemberEmail.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addMemberLoading ? 'Добавление...' : 'Добавить участника'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeamDetails;
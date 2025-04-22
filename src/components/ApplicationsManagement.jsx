import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApplicationsService } from '../services/applicationsService';
import Navbar from './Navbar';

const ApplicationsManagement = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  // Получение текущего пользователя
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await ApplicationsService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Ошибка при загрузке пользователя:', error);
        setError('Не удалось загрузить данные пользователя');
      }
    };
    
    loadUser();
  }, []);

  // Загрузка данных соревнования и заявок
  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Загружаем данные соревнования
        const competitionData = await ApplicationsService.fetchCompetition(id);
        setCompetition(competitionData);
        
        // Проверка прав организатора
        ApplicationsService.checkOrganizerRights(competitionData, user);
        
        // Загружаем заявки
        const applicationsData = await ApplicationsService.fetchApplications(id);
        setApplications(applicationsData);
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user]);

  // Обработка изменения статуса заявки
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setLoading(true);
      
      await ApplicationsService.updateApplicationStatus(applicationId, newStatus);
      
      // Обновляем локальное состояние
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      alert(`Статус заявки изменен на "${newStatus}"`);
      
    } catch (error) {
      console.error('Ошибка при изменении статуса заявки:', error.message);
      setError(`Не удалось изменить статус заявки: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательные функции для отображения
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  const getApplicationTypeTitle = (type) => {
    return type === 'командная' ? 'Командная заявка' : 'Индивидуальная заявка';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'на_рассмотрении': return 'bg-yellow-900 text-yellow-300';
      case 'одобрена': return 'bg-green-900 text-green-300';
      case 'отклонена': return 'bg-red-900 text-red-300';
      case 'отменена': return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  // Индикатор загрузки
  if (loading && !competition) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  // Сообщение об ошибке
  if (error && !competition) {
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
        {competition && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Управление заявками</h1>
                <h2 className="text-lg text-gray-400 mt-1">{competition.name}</h2>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <Link to={`/competitions/${id}`} className="text-gray-300 hover:text-white">
                  ← К соревнованию
                </Link>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900 text-white rounded-lg">
                {error}
              </div>
            )}
            
            {/* Вкладки для фильтрации */}
            <div className="mb-6">
              <div className="border-b border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
                      !activeTab ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(null)}
                  >
                    Все
                  </button>
                  <button
                    className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'на_рассмотрении' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('на_рассмотрении')}
                  >
                    На рассмотрении
                  </button>
                  <button
                    className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'одобрена' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('одобрена')}
                  >
                    Одобренные
                  </button>
                  <button
                    className={`mr-2 py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'отклонена' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('отклонена')}
                  >
                    Отклоненные
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Список заявок */}
            {applications.length === 0 ? (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-lg text-gray-400">Нет заявок на участие в соревновании</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications
                  .filter(app => !activeTab || app.status === activeTab)
                  .map(app => (
                    <div key={app.id} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <div className="flex items-center mb-2">
                            <span className="px-2 py-1 mr-2 rounded-full text-xs bg-gray-700 text-gray-300">
                              {getApplicationTypeTitle(app.application_type)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          
                          {app.application_type === 'командная' ? (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold">{app.teams?.name || 'Команда'}</h3>
                              <p className="text-sm text-gray-400">
                                Капитан: {app.teams?.users?.full_name || app.teams?.users?.email || 'Неизвестно'}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold">{app.users?.full_name || 'Участник'}</h3>
                              <p className="text-sm text-gray-400">
                                Email: {app.users?.email || 'Неизвестно'}
                              </p>
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-500">
                            Заявка подана: {formatDate(app.submitted_at)}
                          </p>
                        </div>
                        
                        {/* Кнопки управления статусом */}
                        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                          {app.status === 'на_рассмотрении' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(app.id, 'одобрена')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition text-sm"
                                disabled={loading}
                              >
                                Одобрить
                              </button>
                              
                              <button
                                onClick={() => handleStatusChange(app.id, 'отклонена')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition text-sm"
                                disabled={loading}
                              >
                                Отклонить
                              </button>
                            </>
                          )}
                          
                          {app.status === 'одобрена' && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'отклонена')}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition text-sm"
                              disabled={loading}
                            >
                              Отменить участие
                            </button>
                          )}
                          
                          {app.status === 'отклонена' && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'одобрена')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition text-sm"
                              disabled={loading}
                            >
                              Восстановить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationsManagement;
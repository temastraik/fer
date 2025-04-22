import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, fetchDisciplines, fetchCompetitions } from '../services/competitionServiceList';
import Navbar from './Navbar';

// Competition card component
const CompetitionCard = ({ competition }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-5 hover:shadow-lg transition">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">{competition.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs inline-block sm:inline mt-1 sm:mt-0 ${
          competition.status === 'открыта_регистрация' ? 'bg-green-900 text-green-300' :
          competition.status === 'идет_соревнование' ? 'bg-blue-900 text-blue-300' :
          competition.status === 'завершено' ? 'bg-gray-700 text-gray-300' :
          'bg-yellow-900 text-yellow-300'
        }`}>
          {competition.status === 'открыта_регистрация' ? 'Регистрация открыта' :
           competition.status === 'идет_соревнование' ? 'Идет соревнование' :
           competition.status === 'завершено' ? 'Завершено' :
           'Скоро открытие'}
        </span>
      </div>
      
      <p className="text-gray-400 text-sm mt-2">
        {competition.description?.length > 100 
          ? competition.description.substring(0, 100) + '...' 
          : competition.description}
      </p>
      
      <div className="mt-4 text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <span className="mb-1 sm:mb-0">Начало регистрации:</span>
          <span className="text-gray-400">
            {new Date(competition.registration_start_date).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between mt-1">
          <span className="mb-1 sm:mb-0">Конец регистрации:</span>
          <span className="text-gray-400">
            {new Date(competition.registration_end_date).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between mt-1">
          <span className="mb-1 sm:mb-0">Начало соревнования:</span>
          <span className="text-gray-400">
            {new Date(competition.start_date).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
          <span className={`px-2 py-1 bg-gray-700 rounded-full text-xs ${
            competition.type === 'открытое' ? 'text-green-400' :
            competition.type === 'региональное' ? 'text-yellow-400' :
            'text-blue-400'
          }`}>
            {competition.type}
          </span>
          <span className="px-2 py-1 bg-gray-700 rounded-full text-xs text-purple-400">
            {competition.discipline_name || 'Общее программирование'}
          </span>
        </div>
        
        <Link 
          to={`/competitions/${competition.id}`}
          className="text-blue-500 hover:text-blue-400 text-sm"
        >
          Подробнее →
        </Link>
      </div>
    </div>
  );
};

// Main competitions list component
const CompetitionsList = () => {
  const [user, setUser] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    discipline_id: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [disciplines, setDisciplines] = useState([]);

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
    };
    
    getUser();
  }, []);

  // Fetch disciplines
  useEffect(() => {
    const getDisciplines = async () => {
      try {
        const disciplinesData = await fetchDisciplines();
        setDisciplines(disciplinesData);
      } catch (error) {
        console.error('Error loading disciplines:', error.message);
      }
    };
    
    getDisciplines();
  }, []);

  // Fetch competitions with filters
  useEffect(() => {
    const getCompetitions = async () => {
      setLoading(true);
      
      try {
        const competitionsData = await fetchCompetitions(filters);
        setCompetitions(competitionsData);
        setError(null);
      } catch (error) {
        console.error('Error loading competitions:', error.message);
        setError('Не удалось загрузить список соревнований');
      } finally {
        setLoading(false);
      }
    };
    
    getCompetitions();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      discipline_id: '',
      search: ''
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-0">Соревнования</h1>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={toggleFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition sm:hidden"
            >
              {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            </button>
            
            <Link
              to="/competitions/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-center"
            >
              Создать соревнование
            </Link>
          </div>
        </div>
        
        {/* Filters section */}
        <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 sm:mb-8 ${!showFilters ? 'hidden sm:block' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Поиск по названию</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="Введите название"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">Тип соревнования</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Все типы</option>
                <option value="открытое">Открытое</option>
                <option value="региональное">Региональное</option>
                <option value="федеральное">Федеральное</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">Статус</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Все статусы</option>
                <option value="черновик">Черновик</option>
                <option value="опубликовано">Опубликовано</option>
                <option value="открыта_регистрация">Регистрация открыта</option>
                <option value="идет_соревнование">Идет соревнование</option>
                <option value="завершено">Завершено</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">Дисциплина</label>
              <select
                name="discipline_id"
                value={filters.discipline_id}
                onChange={handleFilterChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Все дисциплины</option>
                {disciplines.map(discipline => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>
        
        {/* Competitions list */}
        {loading ? (
          <div className="text-center py-10">
            <div className="text-lg text-gray-400">Загрузка соревнований...</div>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-900 text-white rounded-lg">
            <div className="text-lg">{error}</div>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md"
            >
              Попробовать снова
            </button>
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-10 bg-gray-800 rounded-lg">
            <div className="text-lg text-gray-400">
              {Object.values(filters).some(v => v) 
                ? 'Нет соревнований, соответствующих выбранным фильтрам' 
                : 'Нет доступных соревнований'}
            </div>
            {Object.values(filters).some(v => v) && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Сбросить фильтры
              </button>
            )}
            <Link
              to="/competitions/create"
              className="mt-4 ml-0 sm:ml-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              Создать соревнование
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {competitions.map(competition => (
              <CompetitionCard 
                key={competition.id} 
                competition={competition} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsList;
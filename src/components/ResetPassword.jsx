// src/components/ResetPassword.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession, updatePassword } from '../services/resetPasswordService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Проверка наличия сессии сброса пароля
  useEffect(() => {
    const checkResetSession = async () => {
      const sessionData = await getSession();

      // Если нет активной сессии со сбросом пароля, перенаправляем на страницу входа
      if (!sessionData?.session?.user?.email) {
        navigate('/login');
      }
    };

    checkResetSession();
  }, [navigate]);

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Пожалуйста, введите новый пароль');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Обновляем пароль пользователя
      await updatePassword(password);

      setMessage('Пароль успешно изменен! Вы можете войти в систему с новым паролем.');

      // Через 3 секунды перенаправляем пользователя на страницу входа
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error.message);
      setError('Не удалось изменить пароль. Попробуйте позже или запросите новую ссылку для сброса.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="m-auto w-full max-w-md p-5 sm:p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-500">ФСП</h1>
          <p className="text-gray-400 mt-2">Федерация Спортивного Программирования</p>
          <h2 className="text-xl sm:text-2xl font-semibold mt-4 sm:mt-6">Установка нового пароля</h2>
        </div>

        {message ? (
          // Сообщение об успешной смене пароля
          <div className="p-4 bg-green-900 text-white rounded-lg">
            <p>{message}</p>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-blue-500 hover:underline">
                Перейти на страницу входа
              </Link>
            </div>
          </div>
        ) : (
          // Форма сброса пароля
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="Минимум 8 символов"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 mb-1">Подтверждение пароля</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                placeholder="Повторите новый пароль"
              />
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-900 text-white text-sm rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
import React, { useState } from 'react';
import { migrationService } from '../services/migrationService';
import { useNavigate } from 'react-router-dom';

export default function Migration() {
  const [status, setStatus] = useState('idle'); // idle, running, completed, error
  const [progress, setProgress] = useState('');
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const handleStartMigration = async () => {
    if (!window.confirm('Це перенесе всі дані проектів у Supabase. Існуючі записи будуть оновлені. Продовжити?')) return;
    
    setStatus('running');
    try {
      const result = await migrationService.migrateAllProjects((msg) => {
        setProgress(msg);
      });
      setCount(result.count);
      setStatus('completed');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setProgress(err.message);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🚀 Міграція Проектів на Supabase
        </h1>
        
        <p className="text-gray-600 mb-6">
          Цей інструмент перенесе всю історію ваших проектів, товари та платежі з Google Таблиць у нову базу даних Supabase. 
          Це значно прискорить роботу модуля.
        </p>

        {status === 'idle' && (
          <button
            onClick={handleStartMigration}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Запустити перенесення даних
          </button>
        )}

        {status === 'running' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Триває міграція...</p>
            <p className="text-sm text-gray-500 mt-2">{progress}</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-bold text-lg mb-2">Міграція завершена!</p>
            <p className="text-green-600 mb-4">Перенесено проектів: {count}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
            >
              До списку проектів
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-bold mb-2">Сталася помилка:</p>
            <p className="text-red-600 text-sm mb-4">{progress}</p>
            <button
              onClick={() => setStatus('idle')}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
            >
              Спробувати знову
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

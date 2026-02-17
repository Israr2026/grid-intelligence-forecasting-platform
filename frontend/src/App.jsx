import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { initializeData } from './utils/api';

function App() {
  const [dataInitialized, setDataInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    // Initialize data on first load
    const init = async () => {
      try {
        setInitializing(true);
        await initializeData(30);
        setDataInitialized(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        // Continue anyway - data might already exist
        setDataInitialized(true);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing grid data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Dashboard />
    </div>
  );
}

export default App;


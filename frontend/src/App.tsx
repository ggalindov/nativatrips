import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col w-full bg-[#f5f1e7] text-[#13201a]">
        <main className="flex-1 flex flex-col w-full">
          <Routes>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SplitLayout } from './components/SplitLayout';

function App() {
  return (
    <Router>
      <SplitLayout />
    </Router>
  );
}

export default App;

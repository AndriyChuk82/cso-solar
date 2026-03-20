import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplitLayout } from './components/SplitLayout';

function App() {
  return (
    <Router>
      <Layout>
        <SplitLayout />
      </Layout>
    </Router>
  );
}

export default App;

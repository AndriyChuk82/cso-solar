import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplitLayout } from './components/SplitLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router basename="/projects">
        <Layout>
          <SplitLayout />
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

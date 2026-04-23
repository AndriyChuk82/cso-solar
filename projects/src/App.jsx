import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplitLayout } from './components/SplitLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from '@cso/design-system';

function App() {
  useTheme(); // Initialize theme and font scale
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

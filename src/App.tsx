import React, { useState, useEffect } from 'react';
import MSASelector from './components/MSASelector';
import { LoginForm } from './components/LoginForm';
import { ProcessingStatus } from './types';
import { api } from './config/api';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [selectedMSAs, setSelectedMSAs] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProcess = async () => {
    if (selectedMSAs.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one MSA' });
      return;
    }

    console.log('Selected MSAs for processing:', selectedMSAs);
    setProcessing(true);
    setStatus({ type: 'info', message: 'Processing MSAs...' });

    try {
      const result = await api.processMSAs(selectedMSAs);
      console.log('Processing result:', result);
      
      if (result.errors.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Processed ${result.processed.length} MSAs with ${result.errors.length} errors.` 
        });
        console.error('Processing errors:', result.errors);
      } else {
        setStatus({ 
          type: 'success', 
          message: `Successfully processed ${result.processed.length} MSAs` 
        });
      }
    } catch (error) {
      console.error('Processing failed:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Error processing MSAs' 
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!session) {
    return <LoginForm onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="app">
      <h1>MSA Content Processor</h1>
      <MSASelector 
        selectedMSAs={selectedMSAs} 
        setSelectedMSAs={setSelectedMSAs} 
      />
      <div className="actions">
        <button 
          onClick={handleProcess} 
          disabled={processing || selectedMSAs.length === 0}
        >
          {processing ? 'Processing...' : 'Process Selected MSAs'}
        </button>
      </div>
      {status && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

// Add default export
export default App;

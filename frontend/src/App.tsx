import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  const greet = async () => {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const result = await invoke('greet', { name });
    setGreetMsg(String(result));
  };

  return (
    <main>
      <h1>Hello world</h1>

      <form
        style={{ display: 'flex', gap: '1rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

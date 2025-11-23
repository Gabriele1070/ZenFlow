import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateMeditationScript, generateMeditationAudio } from './services/geminiService';
import { AppState } from './types';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Audio State
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Initialize Audio Context on user interaction (to comply with browser policies)
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setAppState(AppState.GENERATING_SCRIPT);
    setError(null);
    setScript('');
    setHasAudio(false);
    setAudioBuffer(null);
    pausedAtRef.current = 0;

    try {
      const generatedScript = await generateMeditationScript(topic);
      setScript(generatedScript);
      setAppState(AppState.READY_TO_PLAY);
    } catch (err) {
      setError("Si è verificato un errore durante la generazione della meditazione.");
      setAppState(AppState.IDLE);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) return;
    initAudioContext();
    setIsLoadingAudio(true);
    setError(null);

    try {
      // Create context if not exists
      if (!audioContextRef.current) {
         throw new Error("Audio Context init failed");
      }
      
      const buffer = await generateMeditationAudio(script, audioContextRef.current);
      setAudioBuffer(buffer);
      setHasAudio(true);
      setIsLoadingAudio(false);
      
      // Auto-play after generation? Let's wait for user to click play.
    } catch (err) {
      console.error(err);
      setError("Impossibile generare l'audio. Riprova più tardi.");
      setIsLoadingAudio(false);
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBuffer) return;

    // Create source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    // Handle offset for resume
    const offset = pausedAtRef.current;
    source.start(0, offset);
    
    // Save start time to calculate pause offset later
    startTimeRef.current = audioContextRef.current.currentTime - offset;

    source.onended = () => {
      // Only reset if we reached the end naturally (not stopped manually)
      if (audioContextRef.current && audioContextRef.current.currentTime - startTimeRef.current >= audioBuffer.duration - 0.5) {
        setAppState(AppState.READY_TO_PLAY);
        pausedAtRef.current = 0;
      }
    };

    audioSourceRef.current = source;
    setAppState(AppState.PLAYING);
  };

  const pauseAudio = () => {
    if (audioSourceRef.current && audioContextRef.current) {
      audioSourceRef.current.stop();
      pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      audioSourceRef.current = null;
      setAppState(AppState.PAUSED);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    pausedAtRef.current = 0;
    setAppState(AppState.READY_TO_PLAY);
  };

  const togglePlay = () => {
    if (appState === AppState.PLAYING) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const resetApp = () => {
    stopAudio();
    setTopic('');
    setScript('');
    setHasAudio(false);
    setAudioBuffer(null);
    setAppState(AppState.IDLE);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-zen-500 selection:text-white flex flex-col">
      
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zen-400 to-zen-600 flex items-center justify-center">
             <span className="text-white font-bold text-lg">Z</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">ZenFlow</h1>
        </div>
        {appState !== AppState.IDLE && (
          <button onClick={resetApp} className="text-sm text-slate-400 hover:text-white transition-colors">
            Nuova Meditazione
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto px-6 pb-12">
        
        {/* State: IDLE - Input Form */}
        {appState === AppState.IDLE && (
          <div className="w-full flex-1 flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zen-100 to-zen-300">
                Trova la tua pace interiore
              </h2>
              <p className="text-slate-400 text-lg max-w-lg mx-auto">
                Inserisci un argomento o un'emozione, e l'IA creerà una meditazione guidata su misura per te.
              </p>
            </div>

            <form onSubmit={handleGenerateScript} className="w-full max-w-lg mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-zen-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-[#1e293b] rounded-xl p-2 shadow-2xl border border-slate-700">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Es. Ansia, Produttività, Sonno..."
                  className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-lg placeholder-slate-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!topic.trim()}
                  className="bg-zen-600 hover:bg-zen-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-6 py-3 font-medium transition-all"
                >
                  Inizia
                </button>
              </div>
            </form>

            <div className="mt-8 flex justify-center gap-3 text-sm text-slate-500">
              <span>Suggerimenti:</span>
              {['Rilassamento muscolare', 'Gratitudine', 'Focus mattutino'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setTopic(tag)}
                  className="hover:text-zen-300 transition-colors underline decoration-dotted"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* State: LOADING SCRIPT */}
        {appState === AppState.GENERATING_SCRIPT && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center">
            <Visualizer isActive={true} />
            <h3 className="text-2xl font-light text-white mt-8">Creo la tua meditazione...</h3>
            <p className="text-slate-400 mt-2">Respira profondamente mentre aspetto.</p>
          </div>
        )}

        {/* State: DISPLAY SCRIPT & PLAYER */}
        {(appState === AppState.READY_TO_PLAY || appState === AppState.PLAYING || appState === AppState.PAUSED) && (
          <div className="w-full flex flex-col h-full animate-fade-in">
            
            {/* Visualizer Area */}
            <div className="flex-shrink-0 mb-6">
               <Visualizer isActive={appState === AppState.PLAYING} />
            </div>

            {/* Audio Controls */}
            <Controls 
              isPlaying={appState === AppState.PLAYING}
              onTogglePlay={togglePlay}
              onStop={stopAudio}
              isLoadingAudio={isLoadingAudio}
              hasAudio={hasAudio}
              onGenerateAudio={handleGenerateAudio}
            />

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-center text-sm">
                {error}
              </div>
            )}

            {/* Script Display */}
            <div className="mt-8 relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 md:p-8 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-zen-300 text-sm font-semibold uppercase tracking-wider mb-4">
                Testo della Meditazione: {topic}
              </h3>
              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-300 font-light">
                  {script}
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      
    </div>
  );
};

export default App;
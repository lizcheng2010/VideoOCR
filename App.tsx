import React, { useState } from 'react';
import { ProcessedLog, ProcessingState } from './types';
import { analyzeVideo } from './services/geminiService';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB warning threshold

const App: React.FC = () => {
  // State
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessedLog | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        alert("This video is quite large (>50MB). Browser processing might be slow.");
      }
      setVideoFile(file);
      setResult(null);
      setErrorMsg(null);
      setProcessingState(ProcessingState.IDLE);
    }
  };

  const handleProcessVideo = async () => {
    if (!videoFile) return;

    try {
      setProcessingState(ProcessingState.ANALYZING);
      
      // Analyze with Gemini
      const analysisResult = await analyzeVideo(videoFile);
      setResult(analysisResult);

      setProcessingState(ProcessingState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setProcessingState(ProcessingState.ERROR);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.extractedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.suggestedFilename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
      setVideoFile(null);
      setResult(null);
      setProcessingState(ProcessingState.IDLE);
      setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <div className="text-blue-500">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                Screen Longshot
            </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Video Upload Section */}
        <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all w-full ${
            videoFile 
            ? 'border-blue-500/50 bg-blue-900/10' 
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
        }`}>
            {!videoFile ? (
                <>
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Upload Screen Recording</h3>
                    <p className="text-zinc-400 text-sm mb-6">Support for MP4, MOV (Max 1 min recommended).<br/>Extracts text from chats & diagrams.</p>
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleFileSelect}
                        className="hidden" 
                        id="video-upload"
                    />
                    <label 
                        htmlFor="video-upload" 
                        className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
                    >
                        Select Video
                    </label>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {videoFile.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    
                    {processingState === ProcessingState.IDLE && (
                        <div className="flex justify-center gap-3 mt-4">
                            <button 
                                onClick={reset}
                                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
                            >
                                Change Video
                            </button>
                            <button 
                                onClick={handleProcessVideo}
                                className="px-6 py-2 rounded-lg text-white font-semibold transition-colors shadow-lg shadow-blue-900/20 bg-blue-600 hover:bg-blue-500"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Processing State Display */}
        {processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETED && (
            <div className="mt-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800 animate-in fade-in duration-500 w-full">
                <div className="flex items-center gap-4 mb-4">
                    {processingState === ProcessingState.ANALYZING && (
                         <div className="relative w-3 h-3">
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping"></div>
                            <div className="relative w-3 h-3 bg-purple-500 rounded-full"></div>
                         </div>
                    )}
                    <h3 className="text-lg font-semibold">
                        {processingState === ProcessingState.ANALYZING && "Gemini is Thinking..."}
                        {processingState === ProcessingState.ERROR && "Error Encountered"}
                    </h3>
                </div>
                
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${
                        processingState === ProcessingState.ERROR ? 'bg-red-500 w-full' :
                        processingState === ProcessingState.ANALYZING ? 'bg-purple-500 w-2/3 animate-pulse' :
                        'bg-blue-500 w-full'
                    }`}></div>
                </div>
                
                {errorMsg && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
                        {errorMsg}
                    </div>
                )}
            </div>
        )}

        {/* Results */}
        {processingState === ProcessingState.COMPLETED && result && (
            <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                
                {/* Download Option */}
                <div className="w-full">
                    <button 
                        onClick={handleDownloadTxt}
                        className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 rounded-xl transition-all group cursor-pointer text-center w-full"
                    >
                         <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white mb-1">Download Log (.txt)</h3>
                        <p className="text-xs text-zinc-400">Save extracted content to your device</p>
                    </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-semibold text-zinc-200">Content Preview</h3>
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                            {result.startDate} → {result.endDate}
                        </span>
                    </div>
                    <div className="p-6 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono h-96 overflow-y-auto">
                        {result.extractedContent}
                    </div>
                </div>
                
                <div className="text-center">
                    <button onClick={reset} className="text-zinc-500 hover:text-white text-sm underline">Process Another Video</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
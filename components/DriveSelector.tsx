import React, { useState, useEffect } from 'react';
import { DriveFolder } from '../types';
import * as driveService from '../services/driveService';

interface DriveSelectorProps {
  googleClientId: string;
  onFolderSelected: (folder: DriveFolder) => void;
  selectedFolder?: DriveFolder;
}

export const DriveSelector: React.FC<DriveSelectorProps> = ({ googleClientId, onFolderSelected, selectedFolder }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
        try {
            await driveService.initGapiClient(googleClientId);
            const client = driveService.initTokenClient(googleClientId, (resp) => {
                if (resp && resp.access_token) {
                    setIsAuthenticated(true);
                    loadFolders();
                }
            });
            setTokenClient(client);
        } catch (error) {
            console.error("Failed to init Google Drive", error);
        }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleAuth = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const loadFolders = async () => {
    setLoading(true);
    try {
        const results = await driveService.listFolders();
        setFolders(results);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-full mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.993C6.486 1.993 2 6.48 2 12.007c0 5.526 4.486 10.013 10.01 10.013 5.527 0 10.013-4.487 10.013-10.013 0-5.527-4.486-10.014-10.013-10.014zm0 18.027c-4.418 0-8.013-3.595-8.013-8.014 0-4.418 3.595-8.013 8.013-8.013 4.419 0 8.014 3.595 8.014 8.013 0 4.419-3.595 8.014-8.014 8.014zm-1.026-6.685l-2.427-2.427 1.414-1.414 1.013 1.013 4.24-4.24 1.414 1.414-5.654 5.654z"/></svg>
            Google Drive Destination
        </h3>
        {isAuthenticated && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Connected</span>
        )}
      </div>

      {!isAuthenticated ? (
        <button
          onClick={handleAuth}
          className="bg-white text-black font-semibold py-2 px-4 rounded hover:bg-zinc-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
          Connect Google Drive
        </button>
      ) : (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-zinc-400 mb-2">Select Target Folder</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => onFolderSelected(folder)}
                            className={`text-left px-3 py-2 rounded border text-sm truncate transition-colors ${
                                selectedFolder?.id === folder.id 
                                ? 'bg-blue-600/20 border-blue-600 text-blue-200' 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        >
                            📁 {folder.name}
                        </button>
                    ))}
                    {folders.length === 0 && !loading && (
                         <div className="text-zinc-500 text-sm italic">No folders found in root.</div>
                    )}
                </div>
                {loading && <div className="text-zinc-500 text-xs mt-2">Loading folders...</div>}
            </div>
            {selectedFolder && (
                 <div className="text-sm text-blue-400">
                    Active Folder: <span className="font-bold text-white">{selectedFolder.name}</span>
                 </div>
            )}
        </div>
      )}
    </div>
  );
};

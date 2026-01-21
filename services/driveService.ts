// Type definitions for Google API global variables
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const initGapiClient = (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error("Google API script not loaded"));
      return;
    }
    
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          clientId: clientId,
          discoveryDocs: [DISCOVERY_DOC],
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const initTokenClient = (clientId: string, callback: (resp: any) => void) => {
  if (!window.google) return null;
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: callback,
  });
};

export const listFolders = async (searchTerm?: string): Promise<{ id: string; name: string }[]> => {
  try {
    let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    if (searchTerm) {
      query += ` and name contains '${searchTerm}'`;
    }
    
    const response = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 10,
    });
    return response.result.files;
  } catch (err) {
    console.error("Error listing folders", err);
    throw err;
  }
};

export const createDocInDrive = async (fileName: string, content: string, folderId?: string): Promise<string> => {
  const metadata: any = {
    name: fileName,
    mimeType: 'application/vnd.google-apps.document', // Google Doc
  };
  
  if (folderId) {
    metadata.parents = [folderId];
  }

  // Create a multipart request to upload text content and convert to Google Doc
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'application/json';
  
  // We upload as plain text but ask Drive to convert to Docs
  const multipartRequestBody =
    delimiter +
    'Content-Type: ' + contentType + '\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain\r\n\r\n' +
    content +
    close_delim;

  const request = window.gapi.client.request({
    'path': '/upload/drive/v3/files',
    'method': 'POST',
    'params': {'uploadType': 'multipart'},
    'headers': {
      'Content-Type': 'multipart/related; boundary="' + boundary + '"'
    },
    'body': multipartRequestBody
  });

  try {
    const response = await request;
    return response.result.id;
  } catch (e) {
    console.error("Error uploading to drive", e);
    throw e;
  }
};

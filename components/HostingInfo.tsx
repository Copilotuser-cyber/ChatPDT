
import React from 'react';

export const HostingInfo: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-white">How to Host This App</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6 text-slate-300">
          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">1. Vercel (Recommended)</h3>
            <p className="text-sm">Vercel is the easiest platform for React apps. It offers an excellent free tier and zero-config deployment.</p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Push your code to a GitHub repository.</li>
              <li>Import the project in Vercel Dashboard.</li>
              <li><b>Crucial:</b> Add an Environment Variable named <code className="bg-slate-800 px-1 rounded text-indigo-300">API_KEY</code> with your Gemini API key from <a href="https://aistudio.google.com/" target="_blank" className="underline">Google AI Studio</a>.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">2. Netlify</h3>
            <p className="text-sm">Netlify is another great alternative with powerful features.</p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Connect your Git repo to Netlify.</li>
              <li>Go to "Site Settings" &gt; "Environment Variables".</li>
              <li>Add your <code className="bg-slate-800 px-1 rounded text-indigo-300">API_KEY</code>.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-indigo-400 mb-2">3. GitHub Pages</h3>
            <p className="text-sm">For GitHub Pages, you'll need to use a build tool like Vite or Create React App and set up a deployment workflow.</p>
            <p className="text-sm mt-2 font-medium text-amber-400/80 italic">Note: Never commit your API key directly to your code! Always use environment variables.</p>
          </section>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
             <h4 className="font-bold text-white mb-1">Getting an API Key</h4>
             <p className="text-xs">Go to <a href="https://aistudio.google.com/" className="text-indigo-400 font-bold hover:underline">Google AI Studio</a> to get your free Gemini API key. It works with the models configured in this app.</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

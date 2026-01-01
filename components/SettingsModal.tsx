
import React, { useState } from 'react';
import { X, Key, ShieldCheck, Info, Video } from 'lucide-react';
import { ApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, keys, onSave }) => {
  const [localKeys, setLocalKeys] = useState<ApiKeys>(keys);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amz-blue" />
            <h2 className="text-lg font-bold text-gray-800">API 密钥配置</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
            <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                您的密钥仅加密存储在本地浏览器。建议使用自定义 Key 以获得更高的生成限额和稳定性。
                </p>
            </div>
            <div className="flex gap-3 border-t border-blue-200 pt-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                若留空，系统将自动回退并使用预设的默认公共 Key（可能存在频次限制）。
                </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <label className="flex items-center text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                <Key className="w-3 h-3 mr-1.5 text-amz-blue" />
                Gemini API Key (文本/图片)
              </label>
              <input 
                type="password"
                value={localKeys.gemini}
                onChange={(e) => setLocalKeys(prev => ({ ...prev, gemini: e.target.value }))}
                placeholder="不填则使用系统默认..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amz-blue outline-none text-sm font-mono bg-gray-50 focus:bg-white transition-all"
              />
            </div>
            
            <div className="relative group p-4 bg-purple-50/30 rounded-xl border border-purple-100">
              <label className="flex items-center text-xs font-bold text-purple-600 uppercase mb-2 tracking-wider">
                <Video className="w-3 h-3 mr-1.5" />
                Veo 3.1 API Key (视频专用)
              </label>
              <input 
                type="password"
                value={localKeys.veo}
                onChange={(e) => setLocalKeys(prev => ({ ...prev, veo: e.target.value }))}
                placeholder="不填则使用系统默认..."
                className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono bg-white transition-all shadow-sm"
              />
              <p className="mt-2 text-[10px] text-purple-400 font-medium">
                此 Key 将专门用于视频工作室的高级渲染。
              </p>
            </div>
          </div>

          <div className="pt-2">
             <button 
              onClick={() => { onSave(localKeys); onClose(); }}
              className="w-full py-4 bg-amz-dark text-white rounded-xl font-bold hover:bg-amz-light shadow-lg transition-all active:scale-[0.98]"
             >
                保存并应用配置
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

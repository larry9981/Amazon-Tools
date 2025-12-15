import React, { useState } from 'react';
import { generateListingContent } from '../services/geminiService';
import { ListingContent, Language } from '../types';
import { Edit3, Copy, Check, Loader2, Sparkles, Wand2 } from 'lucide-react';

interface ListingOptimizerProps {
    language: Language;
    seedKeywords: string[];
}

const ListingOptimizer: React.FC<ListingOptimizerProps> = ({ language, seedKeywords }) => {
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ListingContent | null>(null);

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setIsLoading(true);
        try {
            // Use top 5 keywords if available, or empty
            const keywordsToUse = seedKeywords.slice(0, 5);
            const content = await generateListingContent(description, keywordsToUse, language);
            setResult(content);
        } catch (e) {
            alert("Error generating listing.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTitleChange = (val: string) => setResult(prev => prev ? { ...prev, title: val } : null);
    
    const handleBulletChange = (index: number, val: string) => {
        setResult(prev => {
            if (!prev) return null;
            const newBullets = [...prev.bullets];
            newBullets[index] = val;
            return { ...prev, bullets: newBullets };
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Edit3 className="w-5 h-5 text-amz-blue mr-2" />
                    Listing Optimizer ({language})
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Paste your raw product specs below. We will write an SEO-optimized Title and 5 Bullet Points inserting your high-traffic keywords.
                </p>
                
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amz-blue"
                    placeholder="Enter product details (Material, Size, Features, Benefits)..."
                />
                
                <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !description}
                    className="mt-4 w-full bg-amz-blue text-white py-3 rounded-lg font-medium hover:bg-opacity-90 flex justify-center items-center"
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                    Generate Listing
                </button>
            </div>

            {result && (
                <div className="space-y-6">
                    {/* Title Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Product Title</label>
                        <textarea 
                            value={result.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-amz-orange"
                        />
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => navigator.clipboard.writeText(result.title)} className="p-2 bg-white border shadow-sm rounded-md hover:bg-gray-100">
                                <Copy className="w-4 h-4 text-gray-600" />
                             </button>
                        </div>
                        <p className="text-xs text-right text-gray-400 mt-1">{result.title.length} characters (Rec: 150-200)</p>
                    </div>

                    {/* Bullets Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-4">5 Bullet Points</label>
                        <div className="space-y-4">
                            {result.bullets.map((bullet, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="absolute left-0 top-3 w-6 flex justify-center text-gray-400 font-bold text-xs">{idx + 1}</div>
                                    <textarea 
                                        value={bullet}
                                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                                        className="w-full h-24 pl-8 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-amz-orange"
                                    />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigator.clipboard.writeText(bullet)} className="p-1.5 bg-white border shadow-sm rounded-md hover:bg-gray-100">
                                            <Copy className="w-3 h-3 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListingOptimizer;
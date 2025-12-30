import React from 'react';
import { LuVideo, LuImage, LuCircleCheck, LuUpload, LuLayers, LuCircleAlert } from 'react-icons/lu';
import { BASE_URL } from '../../utils/apiPaths';

const SocialCard = ({ task, isGridMode, isOverlay, onClick }) => {
    const hasMedia = task.socialMeta?.mediaFiles?.length > 0;
    const isPosted = task.socialMeta?.isPosted;
    const postType = task.socialMeta?.postType || 'static';
    
    // --- FIX: Smart URL Resolution ---
    const getFullUrl = (path) => {
        if (!path) return null;
        // If it's already a link (Cloudinary), use it. Otherwise, assume local uploads folder.
        return path.startsWith('http') ? path : `${BASE_URL}${path}`;
    };

    const displayImage = getFullUrl(task.socialMeta?.gridDisplayImage);

    // --- GRID VIEW ---
    if (isGridMode) {
        // SCENARIO A: Has Image (Show Content)
        if (displayImage) {
            return (
                <div onClick={onClick} className="w-full h-full relative group cursor-pointer bg-slate-100">
                    <img 
                        src={displayImage} 
                        alt="Post" 
                        className="w-full h-full object-cover" 
                    />
                    
                    {/* TYPE INDICATOR ICON (Top Right) */}
                    <div className="absolute top-2 right-2 text-white drop-shadow-md">
                        {postType === 'reel' && <LuVideo />}
                        {postType === 'carousel' && <LuLayers />}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs text-center p-2">
                        {task.title}
                    </div>
                </div>
            );
        }
        
        // SCENARIO B: Empty / Missing Media (Show Alert)
        return (
            <div 
                onClick={onClick} 
                className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50 cursor-pointer transition-all group relative"
            >
                <div className="mb-2 text-slate-400 group-hover:text-primary transition-colors">
                    <LuUpload size={24} />
                </div>
                
                <span className="text-xs font-semibold text-slate-700 line-clamp-2 mb-2 leading-tight px-1">
                    {task.title}
                </span>
                
                <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 text-[10px] font-bold uppercase tracking-wide shadow-sm">
                    <LuCircleAlert size={10} /> Needs Media
                </div>
            </div>
        );
    }

    // --- WAREHOUSE (LIST) VIEW ---
    return (
        <div 
            onClick={onClick}
            className={`
            bg-white p-3 rounded-lg border shadow-sm flex gap-3 relative cursor-pointer transition-all
            ${isOverlay ? 'shadow-xl rotate-2 cursor-grabbing' : 'hover:border-primary/50 hover:shadow-md'}
            ${isPosted ? 'opacity-60 grayscale' : ''}
        `}>
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center text-slate-400">
                {displayImage ? (
                    <img src={displayImage} className="w-full h-full object-cover" />
                ) : (
                    // Default Icon if no image
                    postType === 'reel' ? <LuVideo size={20} /> : 
                    postType === 'carousel' ? <LuLayers size={20} /> :
                    <LuImage size={20} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-slate-800 line-clamp-2">{task.title}</h4>
                </div>
                
                <div className="mt-2 flex items-center gap-2">
                    {/* Badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        postType === 'reel' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                        postType === 'carousel' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        {postType === 'reel' && <LuVideo size={10} />}
                        {postType === 'carousel' && <LuLayers size={10} />}
                        {postType.toUpperCase()}
                    </span>
                    
                    {!hasMedia && (
                        <span className="text-[10px] text-orange-500 flex items-center gap-1">
                             <LuUpload size={10}/> Needs Media
                        </span>
                    )}
                </div>
            </div>

            {isPosted && (
                <div className="absolute top-2 right-2 text-green-500">
                    <LuCircleCheck />
                </div>
            )}
        </div>
    );
};

export default SocialCard;
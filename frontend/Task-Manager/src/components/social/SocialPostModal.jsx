import React, { useState, useEffect } from 'react';
import { LuUpload, LuSave, LuVideo, LuTrash2, LuImage, LuMaximize2, LuX, LuCirclePlay, LuLayers, LuCalendar } from 'react-icons/lu';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS, BASE_URL } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import SelectUsers from '../Inputs/SelectUsers'; 

const SocialPostModal = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
    if (!task) return null;

    const [loading, setLoading] = useState(false);
    
    // Form State
    const [title, setTitle] = useState("");
    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [postType, setPostType] = useState("static");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState([]);
    
    // NEW: Scheduled Date for Social Calendar
    const [scheduledDate, setScheduledDate] = useState("");

    // Media State
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedCoverUrl, setSelectedCoverUrl] = useState(null); 
    
    // Lightbox State
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title || "");
            setCaption(task.socialMeta?.caption || "");
            setHashtags(task.socialMeta?.hashtags || "");
            setPostType(task.socialMeta?.postType || "static");
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
            setAssignedTo(task.assignedTo || []);
            setMediaFiles(task.socialMeta?.mediaFiles || []);
            setSelectedCoverUrl(task.socialMeta?.gridDisplayImage || null);
            
            // LOAD SCHEDULED DATE
            setScheduledDate(task.socialMeta?.scheduledDate ? new Date(task.socialMeta.scheduledDate).toISOString().split('T')[0] : "");
        }
    }, [task]);

    // --- UTILS ---
    const getFullUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${BASE_URL}${path}`;
    };

    const isVideo = (filename) => {
        if (!filename) return false;
        const ext = filename.split('.').pop().toLowerCase();
        return ['mp4', 'mov', 'webm', 'ogg', 'mkv', 'avi'].includes(ext);
    };

    // --- SMART TYPE DETECTOR ---
    const autoDetectPostType = (files) => {
        if (files.length > 1) {
            setPostType('carousel');
        } else if (files.length === 1) {
            if (isVideo(files[0].url)) {
                setPostType('reel');
            } else {
                setPostType('static');
            }
        } else {
            setPostType('static'); // Default empty
        }
    };

    // --- UPLOAD LOGIC ---
    const handleFileUpload = async (files, isCoverOnly = false) => {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));

        try {
            setLoading(true);
            const res = await axiosInstance.post(API_PATHS.SOCIAL.UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newFiles = res.data.files.map(f => ({
                url: f.filePath, 
                mimeType: f.mimeType,
                originalName: f.originalName
            }));

            if (isCoverOnly) {
                setSelectedCoverUrl(newFiles[0].url);
                toast.success("Cover updated!");
            } else {
                setMediaFiles(prev => {
                    const updatedList = [...prev, ...newFiles];
                    autoDetectPostType(updatedList); 
                    return updatedList;
                });

                if (!selectedCoverUrl && newFiles.length > 0) {
                    setSelectedCoverUrl(newFiles[0].url);
                }
                toast.success("File uploaded!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setLoading(false);
            setIsDragOver(false);
        }
    };

    const handleRemoveFile = (index) => {
        const fileToRemove = mediaFiles[index];
        const newFiles = mediaFiles.filter((_, i) => i !== index);
        
        setMediaFiles(newFiles);
        autoDetectPostType(newFiles);

        if (fileToRemove.url === selectedCoverUrl) {
            setSelectedCoverUrl(newFiles.length > 0 ? newFiles[0].url : null);
        }
    };

    // --- DRAG & DROP HANDLERS ---
    const onDrop = (e) => {
        e.preventDefault();
        handleFileUpload(e.dataTransfer.files, false);
    };

    const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };

    const handleDeleteTask = async () => {
        if(!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            setLoading(true);
            await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(task._id));
            toast.success("Task deleted");
            onDelete(task._id); 
            onClose();
        } catch (error) {
            toast.error("Failed to delete task");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            let finalGridImage = selectedCoverUrl;
            if (!finalGridImage && mediaFiles.length > 0) {
                finalGridImage = mediaFiles[0].url;
            }

            const payload = {
                title, dueDate, assignedTo, caption, hashtags, postType, mediaFiles,
                gridDisplayImage: finalGridImage,
                // INCLUDE SCHEDULED DATE
                scheduledDate: scheduledDate || null 
            };

            const res = await axiosInstance.put(API_PATHS.SOCIAL.UPDATE_TASK(task._id), payload);
            toast.success("Saved successfully");
            onUpdate(res.data); 
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const currentPreviewUrl = selectedCoverUrl || (mediaFiles.length > 0 ? mediaFiles[0].url : null);
    const isCurrentVideo = isVideo(currentPreviewUrl);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Edit Social Content">
                <div className="flex flex-col md:flex-row gap-6 h-[70vh] overflow-hidden">
                    
                    {/* LEFT COLUMN: VISUALS */}
                    <div className="w-full md:w-1/2 flex flex-col gap-3 overflow-y-auto pr-2 border-r border-slate-100">
                        <div 
                            className={`
                                relative aspect-square rounded-lg flex flex-col items-center justify-center border-2 border-dashed transition-all group overflow-hidden
                                ${isDragOver ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50'}
                                ${!currentPreviewUrl ? 'cursor-pointer' : 'cursor-zoom-in'}
                            `}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onClick={() => currentPreviewUrl ? setLightboxUrl(currentPreviewUrl) : document.getElementById('main-upload').click()}
                        >
                            {currentPreviewUrl ? (
                                <>
                                    {isCurrentVideo ? (
                                        <>
                                            <video src={getFullUrl(currentPreviewUrl)} className="w-full h-full object-contain bg-black" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                <LuCirclePlay className="text-white opacity-80 group-hover:scale-110 transition-transform" size={48} />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={getFullUrl(currentPreviewUrl)} alt="Preview" className="w-full h-full object-contain" />
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <LuMaximize2 size={16} />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4 pointer-events-none">
                                    <LuUpload className={`mx-auto text-4xl mb-2 transition-colors ${isDragOver ? 'text-primary' : 'text-slate-300'}`} />
                                    <p className="text-slate-500 text-sm font-medium">
                                        {isDragOver ? "Drop file here" : "Drag & Drop or Click to Upload"}
                                    </p>
                                </div>
                            )}
                            {isDragOver && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
                                    <p className="text-primary font-bold text-lg bg-white/80 px-4 py-2 rounded-full shadow-sm">Drop to Upload</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                             <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 hover:text-primary hover:border-primary transition-all text-sm font-medium shadow-sm">
                                <LuUpload size={16} /> 
                                {mediaFiles.length > 0 ? "Add More" : "Select File"}
                                <input id="main-upload" type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, false)} />
                            </label>

                            {postType === 'reel' && (
                                <label className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-100 font-medium text-sm border border-purple-100 transition-all shadow-sm" title="Upload Custom Cover">
                                    <LuImage size={16} /> Set Cover
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files, true)} />
                                </label>
                            )}
                        </div>

                        {mediaFiles.length > 0 && (
                            <div className="mt-2">
                                <div className="flex gap-2 overflow-x-auto pb-2 min-h-[70px] custom-scrollbar">
                                    {mediaFiles.map((file, idx) => {
                                        const isCover = file.url === selectedCoverUrl;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setSelectedCoverUrl(file.url)}
                                                className={`
                                                    w-16 h-16 relative flex-shrink-0 border-2 rounded-md overflow-hidden cursor-pointer group/thumb transition-all
                                                    ${isCover ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-400'}
                                                `}
                                            >
                                                {isVideo(file.url) ? (
                                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white"><LuVideo /></div>
                                                ) : (
                                                    <img src={getFullUrl(file.url)} className="w-full h-full object-cover" />
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10"
                                                >
                                                    <LuTrash2 size={10} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: DETAILS */}
                    <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto px-1 custom-scrollbar">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Idea Title</label>
                            <input 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className="w-full border-b border-slate-300 py-1 font-bold text-lg focus:outline-none focus:border-primary bg-transparent"
                            />
                        </div>

                        {/* POST TYPE & SCHEDULE ROW */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Post Type</label>
                                <select 
                                    value={postType} 
                                    onChange={(e) => setPostType(e.target.value)}
                                    className="w-full border rounded px-2 py-1.5 mt-1 text-sm bg-white"
                                >
                                    <option value="static">Static Post</option>
                                    <option value="reel">Reel / Video</option>
                                    <option value="carousel">Carousel</option>
                                    <option value="story">Story</option>
                                </select>
                            </div>
                            
                            {/* NEW: SCHEDULED DATE INPUT */}
                            <div className="flex-1">
                                <label className="text-xs font-bold text-primary uppercase flex items-center gap-1">
                                    <LuCalendar /> Schedule For
                                </label>
                                <input 
                                    type="date" 
                                    value={scheduledDate} 
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full border-2 border-primary/20 rounded px-2 py-1.5 mt-1 text-sm focus:border-primary outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Caption</label>
                            <textarea 
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Write your caption here..."
                                className="w-full border rounded p-2 mt-1 text-sm h-32 resize-none focus:ring-1 focus:ring-primary"
                            />
                            <div className="text-right text-xs text-slate-400 mt-1">{caption.length} chars</div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Hashtags</label>
                            <input 
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                placeholder="#marketing #design"
                                className="w-full border rounded px-2 py-1.5 mt-1 text-sm text-blue-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Who is working on this?</label>
                            <SelectUsers selectedUsers={assignedTo} setSelectedUsers={setAssignedTo} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <button onClick={handleDeleteTask} className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
                        <LuTrash2 /> Delete Task
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
                            {loading ? "Saving..." : <><LuSave /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* LIGHTBOX */}
            {lightboxUrl && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full z-50 transition-colors"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <LuX size={32} />
                    </button>
                    
                    {isVideo(lightboxUrl) ? (
                         <video 
                            src={getFullUrl(lightboxUrl)} 
                            controls 
                            autoPlay 
                            className="max-w-full max-h-[90vh] rounded-md shadow-2xl outline-none" 
                            onClick={(e) => e.stopPropagation()} 
                         />
                    ) : (
                        <img 
                            src={getFullUrl(lightboxUrl)} 
                            alt="Full View" 
                            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default SocialPostModal;
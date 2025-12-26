import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { LuPlus } from 'react-icons/lu';
import SocialCard from './SocialCard';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

const Warehouse = ({ items, projectId, onRefresh, onCardClick }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    // NEW: State for the type selector
    const [newType, setNewType] = useState("static"); 

    const { setNodeRef, isOver } = useDroppable({
        id: 'warehouse-zone',
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            await axiosInstance.post(API_PATHS.SOCIAL.CREATE_IDEA, {
                projectId,
                title: newTitle,
                // NEW: Use the selected type
                postType: newType 
            });
            setNewTitle("");
            setNewType("static"); // Reset to default
            setIsCreating(false);
            onRefresh();
            toast.success("Idea added!");
        } catch (error) {
            toast.error("Failed to create idea");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                <h2 className="font-bold text-lg mb-2">Content Warehouse</h2>
                {isCreating ? (
                    <form onSubmit={handleCreate} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                             {/* NEW: Small Type Dropdown */}
                            <select 
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                className="border rounded px-2 py-1 text-xs bg-slate-50 font-medium text-slate-600 focus:outline-primary"
                            >
                                <option value="static">Post</option>
                                <option value="reel">Reel</option>
                                <option value="carousel">Carousel</option>
                            </select>
                            
                            <input 
                                autoFocus
                                className="flex-1 border rounded px-2 py-1 text-sm focus:outline-primary"
                                placeholder="Brief idea..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">Cancel</button>
                            <button type="submit" className="bg-primary text-white px-3 py-1 rounded text-xs font-bold">Add Item</button>
                        </div>
                    </form>
                ) : (
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-primary hover:border-primary transition-all text-sm"
                    >
                        <LuPlus /> Add New Idea
                    </button>
                )}
            </div>

            <div 
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar transition-colors ${isOver ? 'bg-blue-50 ring-inset ring-2 ring-blue-200' : ''}`}
            >
                {items.length === 0 && (
                    <div className="text-center text-slate-400 py-10 text-sm pointer-events-none">
                        No ideas yet. <br/> 
                        {isOver ? "Drop here to unschedule!" : "Start brainstorming!"}
                    </div>
                )}
                {items.map(item => (
                    <DraggableItem 
                        key={item._id} 
                        item={item} 
                        onClick={() => onCardClick(item)} 
                    />
                ))}
            </div>
        </div>
    );
};

// Wrapper for Drag Logic (Unchanged)
const DraggableItem = ({ item, onClick }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item._id,
        data: { type: 'warehouse', item }
    });

    if (isDragging) {
        return <div ref={setNodeRef} className="h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 opacity-50"></div>;
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes}>
            <SocialCard task={item} onClick={onClick} />
        </div>
    );
};

export default Warehouse;
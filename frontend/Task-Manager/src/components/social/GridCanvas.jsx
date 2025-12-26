import React, { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import SocialCard from './SocialCard';

const GridCanvas = ({ gridItems, onCardClick }) => {
    const [ratio, setRatio] = useState('1/1'); // '1/1', '4/5', '3/4', '9/16'

    return (
        <div className="w-full max-w-4xl">
            {/* Ratio Slider */}
            <div className="flex justify-center gap-4 mb-6 text-sm text-slate-600 bg-white p-2 rounded-full shadow-sm w-max mx-auto px-6 overflow-x-auto">
                {['1/1', '4/5', '3/4', '9/16'].map(r => (
                    <button 
                        key={r}
                        onClick={() => setRatio(r)} 
                        className={`whitespace-nowrap px-2 py-1 rounded-md transition-colors ${ratio===r ? 'bg-primary/10 text-primary font-bold' : ''}`}
                    >
                        {r === '1/1' ? 'Square (1:1)' : r === '4/5' ? 'Portrait (4:5)' : r === '3/4' ? 'Standard (3:4)' : 'Reels (9:16)'}
                    </button>
                ))}
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
                {gridItems.map((item, index) => (
                    <GridSlot 
                        key={index} 
                        index={index} 
                        item={item} 
                        ratio={ratio}
                        onCardClick={onCardClick}
                    />
                ))}
            </div>
        </div>
    );
};

// Sub-Component for each slot
const GridSlot = ({ index, item, ratio, onCardClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `grid-slot-${index}`,
    });

    const getAspectRatio = () => {
        if (ratio === '1/1') return 'aspect-square';
        if (ratio === '4/5') return 'aspect-[4/5]';
        if (ratio === '3/4') return 'aspect-[3/4]';
        if (ratio === '9/16') return 'aspect-[9/16]';
        return 'aspect-square';
    };

    return (
        <div 
            ref={setNodeRef}
            className={`
                relative bg-white border rounded-md overflow-hidden transition-all
                ${getAspectRatio()}
                ${isOver ? 'ring-2 ring-primary ring-offset-2 bg-blue-50' : 'border-slate-200'}
                ${!item ? 'flex items-center justify-center' : ''}
            `}
        >
            {item ? (
                <DraggableGridItem item={item} onCardClick={onCardClick} />
            ) : (
                <div className="text-slate-300 text-xs font-medium pointer-events-none">Slot {index + 1}</div>
            )}
        </div>
    );
};

// Wrapper to make grid items draggable
const DraggableGridItem = ({ item, onCardClick }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item._id, // Use same ID strategy as Warehouse
        data: { type: 'grid', item }
    });

    if (isDragging) {
        return <div ref={setNodeRef} className="w-full h-full bg-slate-100 opacity-50" />;
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes} className="w-full h-full cursor-grab active:cursor-grabbing">
            <SocialCard task={item} isGridMode onClick={() => onCardClick(item)} />
        </div>
    );
};

export default GridCanvas;
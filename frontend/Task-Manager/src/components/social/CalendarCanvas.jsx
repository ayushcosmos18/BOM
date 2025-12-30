import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities'; // Import for transform styles
import moment from 'moment';

const CalendarCanvas = ({ gridItems, month, year, onCardClick }) => {
    // Generate all days for the selected month
    const date = moment(`${year}-${month}`, 'YYYY-M');
    const startDay = date.clone().startOf('month').startOf('week');
    const endDay = date.clone().endOf('month').endOf('week');
    const day = startDay.clone().subtract(1, 'day');
    const calendarDays = [];

    while (day.isBefore(endDay, 'day')) {
        calendarDays.push(day.add(1, 'day').clone());
    }

    return (
        <div className="w-full max-w-5xl h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 select-none">
            {/* Header: Weekdays */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* The Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {calendarDays.map((dayItem) => (
                    <CalendarDay 
                        key={dayItem.format('YYYY-MM-DD')}
                        dayItem={dayItem}
                        currentMonth={month}
                        items={gridItems} 
                        onCardClick={onCardClick}
                    />
                ))}
            </div>
        </div>
    );
};

// Sub-Component: Individual Day Slot
const CalendarDay = ({ dayItem, currentMonth, items, onCardClick }) => {
    const dateStr = dayItem.format('YYYY-MM-DD');
    const isCurrentMonth = dayItem.month() + 1 === currentMonth;
    const isToday = dayItem.isSame(moment(), 'day');

    const { setNodeRef, isOver } = useDroppable({
        id: `calendar-day-${dateStr}`, 
    });

    // Find tasks scheduled for this specific date
    const dayTasks = items.filter(item => 
        item && 
        item.socialMeta.scheduledDate && 
        moment(item.socialMeta.scheduledDate).isSame(dayItem, 'day')
    );

    return (
        <div 
            ref={setNodeRef}
            className={`
                min-h-[100px] border-b border-r border-slate-100 p-2 transition-colors relative flex flex-col gap-1
                ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}
                ${isOver ? 'bg-blue-50 ring-inset ring-2 ring-blue-400' : ''}
            `}
        >
            <span className={`
                text-xs font-medium mb-1 block w-max px-1.5 py-0.5 rounded pointer-events-none select-none
                ${isToday ? 'bg-primary text-white' : !isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}
            `}>
                {dayItem.format('D')}
            </span>

            <div className="flex flex-col gap-1 flex-1">
                {dayTasks.map(task => (
                    <DraggableCalendarItem 
                        key={task._id} 
                        task={task} 
                        onCardClick={onCardClick} 
                    />
                ))}
            </div>
        </div>
    );
};

// NEW SUB-COMPONENT: HANDLES DRAGGING INSIDE CALENDAR
const DraggableCalendarItem = ({ task, onCardClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task._id,
        data: task // Pass task data for generic handlers
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...listeners} 
            {...attributes}
            onClick={(e) => { e.stopPropagation(); onCardClick(task); }}
            className="group relative select-none touch-none" // <-- select-none FIXES THE TEXT SELECTION ISSUE
        >
            <div className={`
                text-xs border shadow-sm rounded p-1 cursor-grab active:cursor-grabbing truncate flex items-center gap-1 transition-all
                ${isDragging ? 'bg-blue-50 border-blue-300 scale-105 shadow-md' : 'bg-white border-slate-200 hover:border-primary'}
            `}>
                {/* Status Dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.socialMeta.isPosted ? 'bg-green-500' : 'bg-yellow-400'}`} />
                
                {/* Title */}
                <span className="truncate font-medium text-slate-700">{task.title}</span>
            </div>
        </div>
    );
};

export default CalendarCanvas;
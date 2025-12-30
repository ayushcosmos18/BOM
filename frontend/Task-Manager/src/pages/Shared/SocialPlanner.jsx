import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import moment from 'moment';

import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

import { LuDownload, LuLoader, LuLayoutGrid, LuCalendar } from 'react-icons/lu';

import Warehouse from '../../components/social/Warehouse';
import GridCanvas from '../../components/social/GridCanvas';
import CalendarCanvas from '../../components/social/CalendarCanvas';
import SocialCard from '../../components/social/SocialCard';
import SocialPostModal from '../../components/social/SocialPostModal';

const SocialPlanner = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // VIEW MODE STATE
  const [viewMode, setViewMode] = useState('grid'); 

  // Data State
  const [warehouseItems, setWarehouseItems] = useState([]); 
  // Initialize with NULLs to represent empty slots (Gaps)
  const [gridItems, setGridItems] = useState(new Array(12).fill(null)); 
  
  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Drag & Modal State
  const [activeItem, setActiveItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }, 
  }));

  // --- NAVIGATION ---
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(prev => prev - 1);
    } else {
        setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(prev => prev + 1);
    } else {
        setSelectedMonth(prev => prev + 1);
    }
  };

  // --- DOWNLOAD ---
  const handleDownloadGrid = async () => {
    try {
        setDownloading(true);
        const response = await axiosInstance.get(API_PATHS.SOCIAL.DOWNLOAD, {
            params: { projectId, month: selectedMonth, year: selectedYear },
            responseType: 'blob' 
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' });
        link.setAttribute('download', `Grid-${monthName}-${selectedYear}.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Download started!");

    } catch (error) {
        console.error("Download failed:", error);
        toast.error("Nothing to download for this month.");
    } finally {
        setDownloading(false);
    }
  };

  // --- FETCH DATA ---
  useEffect(() => {
    fetchBoardData();
  }, [projectId, selectedMonth, selectedYear]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(API_PATHS.SOCIAL.GET_BOARD, {
        params: { projectId, month: selectedMonth, year: selectedYear }
      });

      setWarehouseItems(data.warehouse || []);
      
      const newGrid = new Array(12).fill(null);
      if (data.grid) {
        data.grid.forEach(item => {
          // Place item exactly at its stored index, leaving other slots null (Gaps)
          if (item.socialMeta.gridIndex !== null && item.socialMeta.gridIndex < 12) {
            newGrid[item.socialMeta.gridIndex] = item;
          }
        });
      }
      setGridItems(newGrid);
    } catch (error) {
      console.error("Error fetching board:", error);
      toast.error("Failed to load social board");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    setWarehouseItems(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    setGridItems(prev => prev.map(t => t && t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleDeleteTask = (deletedTaskId) => {
    setWarehouseItems(prev => prev.filter(t => t._id !== deletedTaskId));
    setGridItems(prev => prev.map(t => (t && t._id === deletedTaskId ? null : t)));
    setIsModalOpen(false);
  };

  // --- DRAG HANDLERS ---
  const handleDragStart = (event) => {
    const { active } = event;
    const itemInWarehouse = warehouseItems.find(i => i._id === active.id);
    const itemInGrid = gridItems.find(i => i && i._id === active.id);
    setActiveItem(itemInWarehouse || itemInGrid);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return; 

    const sourceId = active.id;
    const destId = over.id.toString(); 

    const draggedItem = warehouseItems.find(i => i._id === sourceId) || gridItems.find(i => i && i._id === sourceId);
    if (!draggedItem) return;

    const currentPlannedMonth = `${selectedYear}-${selectedMonth.toString().padStart(2,'0')}`;

    // -----------------------------------------------------------------
    // 1. DROP TO WAREHOUSE (Remove from Grid/Calendar)
    // -----------------------------------------------------------------
    if (destId === 'warehouse-zone') {
        if (!gridItems.find(i => i && i._id === sourceId)) return; 

        // Non-destructive removal: just turn that slot to null
        const newGrid = gridItems.map(i => (i && i._id === sourceId ? null : i));
        
        const newWarehouse = [
             ...warehouseItems, 
             { ...draggedItem, socialMeta: { ...draggedItem.socialMeta, gridIndex: null, plannedMonth: null, scheduledDate: null } }
        ];

        setGridItems(newGrid);
        setWarehouseItems(newWarehouse);
        await saveGridUpdate([{ taskId: sourceId, gridIndex: null, plannedMonth: null, scheduledDate: null }]);
        return;
    }

    // -----------------------------------------------------------------
    // 2. DROP TO VISUAL GRID SLOT (Manual Placement)
    // -----------------------------------------------------------------
    if (destId.startsWith('grid-slot-')) {
        const destIndex = parseInt(destId.split('-')[2]);
        const isFromWarehouse = warehouseItems.find(i => i._id === sourceId);
        
        if (isFromWarehouse) {
            // WAREHOUSE -> GRID
            const newWarehouse = warehouseItems.filter(i => i._id !== sourceId);
            const newGrid = [...gridItems];
            
            // If dest slot is occupied, move the occupied item back to warehouse
            // (Or you could swap it to the first available slot, but kicking to warehouse is safer for "gaps")
            if (newGrid[destIndex]) { 
                newWarehouse.push({
                    ...newGrid[destIndex],
                    socialMeta: { ...newGrid[destIndex].socialMeta, gridIndex: null, plannedMonth: null }
                });
            }

            const updatedItem = { ...draggedItem, socialMeta: { ...draggedItem.socialMeta, gridIndex: destIndex, plannedMonth: currentPlannedMonth } };
            newGrid[destIndex] = updatedItem;

            setWarehouseItems(newWarehouse);
            setGridItems(newGrid);

            const updates = [{ taskId: sourceId, gridIndex: destIndex, plannedMonth: currentPlannedMonth }];
            if (gridItems[destIndex]) {
                updates.push({ taskId: gridItems[destIndex]._id, gridIndex: null, plannedMonth: null });
            }
            await saveGridUpdate(updates);
        } else {
            // GRID -> GRID (Swapping/Moving)
            const sourceIndex = gridItems.findIndex(i => i && i._id === sourceId);
            if (sourceIndex === destIndex) return;

            const newGrid = [...gridItems];
            const itemAtDest = newGrid[destIndex];

            // Swap: Slot A becomes Slot B (possibly null), Slot B becomes Slot A
            newGrid[destIndex] = newGrid[sourceIndex];
            newGrid[sourceIndex] = itemAtDest; 

            // Update internal indices
            if (newGrid[destIndex]) newGrid[destIndex].socialMeta.gridIndex = destIndex;
            if (newGrid[sourceIndex]) newGrid[sourceIndex].socialMeta.gridIndex = sourceIndex;

            setGridItems(newGrid);

            const updates = [{ taskId: sourceId, gridIndex: destIndex, plannedMonth: currentPlannedMonth }];
            if (itemAtDest) {
                updates.push({ taskId: itemAtDest._id, gridIndex: sourceIndex, plannedMonth: currentPlannedMonth });
            }
            await saveGridUpdate(updates);
        }
        return;
    }

    // -----------------------------------------------------------------
    // 3. DROP TO CALENDAR DATE (Update Date Only)
    // -----------------------------------------------------------------
    if (destId.startsWith('calendar-day-')) {
        const dateStr = destId.replace('calendar-day-', '');
        const newScheduledDate = moment(dateStr).toISOString();

        const isFromWarehouse = warehouseItems.find(i => i._id === sourceId);
        
        if (isFromWarehouse) {
            // WAREHOUSE -> CALENDAR
            // We must place it on the grid to be visible.
            // NON-DESTRUCTIVE: Find the first NULL slot.
            let firstEmptyIndex = gridItems.findIndex(i => i === null);
            
            // Edge Case: Grid is 100% Full
            if (firstEmptyIndex === -1) {
                // Choice: Swap with Slot 0 (Visual overwrite) or Alert.
                // We'll swap with Slot 0 to ensure it lands.
                firstEmptyIndex = 0;
            }

            const newWarehouse = warehouseItems.filter(i => i._id !== sourceId);
            const newGrid = [...gridItems];
            
            // If we had to overwrite Slot 0 because grid was full...
            if (newGrid[firstEmptyIndex]) {
                 newWarehouse.push({
                    ...newGrid[firstEmptyIndex],
                    socialMeta: { ...newGrid[firstEmptyIndex].socialMeta, gridIndex: null, plannedMonth: null }
                 });
            }

            const updatedItem = { 
                ...draggedItem, 
                socialMeta: { 
                    ...draggedItem.socialMeta, 
                    gridIndex: firstEmptyIndex, 
                    plannedMonth: currentPlannedMonth,
                    scheduledDate: newScheduledDate 
                } 
            };
            newGrid[firstEmptyIndex] = updatedItem;

            setWarehouseItems(newWarehouse);
            setGridItems(newGrid);

            const updates = [{ 
                taskId: sourceId, 
                gridIndex: firstEmptyIndex, 
                plannedMonth: currentPlannedMonth, 
                scheduledDate: newScheduledDate 
            }];
            if (gridItems[firstEmptyIndex]) {
                updates.push({ taskId: gridItems[firstEmptyIndex]._id, gridIndex: null, plannedMonth: null });
            }
            await saveGridUpdate(updates);

        } else {
            // GRID -> CALENDAR
            // Just update the date. DO NOT MOVE the grid position.
            const sourceIndex = gridItems.findIndex(i => i && i._id === sourceId);
            if (sourceIndex > -1) {
                const updatedItem = { ...gridItems[sourceIndex] };
                updatedItem.socialMeta.scheduledDate = newScheduledDate;
                
                const newGrid = [...gridItems];
                newGrid[sourceIndex] = updatedItem;
                setGridItems(newGrid);

                await saveGridUpdate([{ taskId: sourceId, scheduledDate: newScheduledDate }]);
            }
        }
    }
  };

  const saveGridUpdate = async (updates) => {
    try {
        await axiosInstance.put(API_PATHS.SOCIAL.UPDATE_GRID, {
            projectId,
            updates
        });
    } catch (error) {
        toast.error("Failed to save changes");
        fetchBoardData(); 
    }
  };

  // Combine items for Calendar View: Warehouse items + Grid Items (filter out nulls)
  const calendarTasks = [...warehouseItems, ...gridItems].filter(t => t !== null);
  const hasGridItems = gridItems.some(item => item !== null);

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Warehouse (Left Sidebar) */}
            <div className="w-1/3 min-w-[350px] border-r border-slate-200 bg-white flex flex-col">
                <Warehouse 
                    items={warehouseItems} 
                    projectId={projectId} 
                    onRefresh={fetchBoardData}
                    onCardClick={handleCardClick}
                />
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-slate-100 flex flex-col items-center">
                
                {/* Header Controls */}
                <div className="mb-6 flex gap-4 w-full max-w-5xl justify-between items-center">
                    
                    {/* View Toggle */}
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LuLayoutGrid /> Grid
                        </button>
                        <button 
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <LuCalendar /> Calendar
                        </button>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm items-center border border-slate-200">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">←</button>
                        <span className="font-bold min-w-[150px] text-center select-none text-lg">
                            {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">→</button>
                    </div>

                    {/* Download Button */}
                    <button 
                        onClick={handleDownloadGrid}
                        disabled={downloading || !hasGridItems}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-all
                            ${!hasGridItems ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}
                        `}
                    >
                        {downloading ? <LuLoader className="animate-spin" /> : <LuDownload />}
                        {downloading ? "Zipping..." : "Download Grid"}
                    </button>
                </div>

                {/* DYNAMIC CANVAS: Grid or Calendar */}
                <div className="w-full flex justify-center flex-1 min-h-0">
                    {viewMode === 'grid' ? (
                        <GridCanvas gridItems={gridItems} onCardClick={handleCardClick} />
                    ) : (
                        <CalendarCanvas 
                            gridItems={calendarTasks} 
                            month={selectedMonth} 
                            year={selectedYear} 
                            onCardClick={handleCardClick}
                        />
                    )}
                </div>
            </div>
        </div>

        <SocialPostModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            task={selectedTask}
            onUpdate={handleTaskUpdate}
            onDelete={handleDeleteTask} 
        />

        <DragOverlay>
            {activeItem ? (
                <div className="opacity-80 rotate-3 scale-105 pointer-events-none w-64">
                    <SocialCard task={activeItem} isOverlay />
                </div>
            ) : null}
        </DragOverlay>
    </DndContext>
  );
};

export default SocialPlanner;
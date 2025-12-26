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

import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';

// FIX: Changed LuLoader2 to LuLoader
import { LuDownload, LuLoader } from 'react-icons/lu';

import Warehouse from '../../components/social/Warehouse';
import GridCanvas from '../../components/social/GridCanvas';
import SocialCard from '../../components/social/SocialCard';
import SocialPostModal from '../../components/social/SocialPostModal';

const SocialPlanner = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false); // New State for Download
  
  // Data State
  const [warehouseItems, setWarehouseItems] = useState([]); 
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

  // --- NEW: HANDLE DOWNLOAD ---
  const handleDownloadGrid = async () => {
    try {
        setDownloading(true);
        const response = await axiosInstance.get(API_PATHS.SOCIAL.DOWNLOAD, {
            params: { projectId, month: selectedMonth, year: selectedYear },
            responseType: 'blob' // CRITICAL: Tells axios this is a file, not JSON
        });

        // Create a temporary link to trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Naming convention: Grid-Feb-2025.zip
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' });
        link.setAttribute('download', `Grid-${monthName}-${selectedYear}.zip`);
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
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
    const destId = over.id; 

    const draggedItem = warehouseItems.find(i => i._id === sourceId) || gridItems.find(i => i && i._id === sourceId);
    if (!draggedItem) return;

    const currentPlannedMonth = `${selectedYear}-${selectedMonth.toString().padStart(2,'0')}`;

    if (destId === 'warehouse-zone') {
        if (!gridItems.find(i => i && i._id === sourceId)) return; 

        const newGrid = gridItems.map(i => (i && i._id === sourceId ? null : i));
        const newWarehouse = [
             ...warehouseItems, 
             { ...draggedItem, socialMeta: { ...draggedItem.socialMeta, gridIndex: null, plannedMonth: null } }
        ];

        setGridItems(newGrid);
        setWarehouseItems(newWarehouse);
        await saveGridUpdate([{ taskId: sourceId, gridIndex: null, plannedMonth: null }]);
        return;
    }

    if (destId.toString().startsWith('grid-slot-')) {
        const destIndex = parseInt(destId.split('-')[2]);
        const isFromWarehouse = warehouseItems.find(i => i._id === sourceId);
        
        if (isFromWarehouse) {
            const newWarehouse = warehouseItems.filter(i => i._id !== sourceId);
            const newGrid = [...gridItems];
            
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
            const sourceIndex = gridItems.findIndex(i => i && i._id === sourceId);
            if (sourceIndex === destIndex) return;

            const newGrid = [...gridItems];
            const itemAtDest = newGrid[destIndex];

            newGrid[destIndex] = newGrid[sourceIndex];
            newGrid[sourceIndex] = itemAtDest;

            if (newGrid[destIndex]) newGrid[destIndex].socialMeta.gridIndex = destIndex;
            if (newGrid[sourceIndex]) newGrid[sourceIndex].socialMeta.gridIndex = sourceIndex;

            setGridItems(newGrid);

            const updates = [{ taskId: sourceId, gridIndex: destIndex, plannedMonth: currentPlannedMonth }];
            if (itemAtDest) {
                updates.push({ taskId: itemAtDest._id, gridIndex: sourceIndex, plannedMonth: currentPlannedMonth });
            }
            await saveGridUpdate(updates);
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

  const hasGridItems = gridItems.some(item => item !== null);

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
        <div className="flex h-screen bg-slate-50 overflow-hidden">
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
                <div className="mb-6 flex gap-4 w-full max-w-4xl justify-between items-center">
                    
                    {/* Month Navigator */}
                    <div className="flex gap-4 bg-white p-2 rounded-lg shadow-sm items-center">
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

                <GridCanvas gridItems={gridItems} onCardClick={handleCardClick} />
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
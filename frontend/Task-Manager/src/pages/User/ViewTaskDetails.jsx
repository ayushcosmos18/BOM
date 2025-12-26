// import React from 'react'
// import { useState,useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import axiosInstance from '../../utils/axiosinstance';
// import { API_PATHS } from '../../utils/apiPaths';
// import DashboardLayout from '../../components/layouts/DashboardLayout';
// import moment from 'moment';
// import AvatarGroup from '../../components/AvatarGroup';
// import { LuSquareArrowOutUpRight } from 'react-icons/lu';
// import CommentSection from '../../components/CommentSection';

// const ViewTaskDetails = () => {
//   const { id } = useParams();
//   const [task, setTask] = useState(null);

//   const getStatusTagColor = (status) => {
//     switch (status) {
//       case "In Progress":
//         return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
//       case "Completed":
//         return "text-lime-500 bg-lime-50 border border-lime-500/20";
//       default:
//         return "text-violet-500 bg-violet-50 border border-violet-500/10";
//     }
//   };

//   //get Task info by ID
//   const getTaskDetailsById = async () => {
//     try {
//       const response = await axiosInstance.get(
//         API_PATHS.TASKS.GET_TASK_BY_ID(id)
//       );
//       if (response.data) {
//         const taskInfo = response.data;
//         setTask(taskInfo);
//       }
//     } catch (error) {
//       console.error("Error fetching tasks", error);
//     }
//   };

//   //handle todo check
//   const updateTodocheclist = async (index) => {
//     const todoChecklist = [...task?.todoChecklist];
//     const taskId = id;

//     if (todoChecklist && todoChecklist[index]) {
//       todoChecklist[index].completed = !todoChecklist[index].completed;
//       try {
//         const response = await axiosInstance.put(
//           API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(taskId),
//           { todoChecklist }
//         );
//         if (response.status === 200) {
//           setTask(response.data?.task || task);
//         } else {
//           todoChecklist[index].completed = !todoChecklist[index].completed;
//         }
//       } catch (error) {
//         todoChecklist[index].completed = !todoChecklist[index].completed;
//       }
//     }
//   };

//   //handle attachment link click
//   const handleLinkClick = (link) => {
//     if (!/^https?:\/\//i.test(link)) {
//       link = "https://" + link;
//     }
//     window.open(link, "_blank");
//   };

//   useEffect(() => {
//     if (id) {
//       getTaskDetailsById();
//     }
//     return () => {};
//   }, [id]);

//   return (
//     <DashboardLayout activeMenu="My Tasks">
//       <div className="mt-5">
//         {task && (
//           <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
//             <div className="form-card col-span-3">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl md:text-xl font-medium">
//                   {task?.title}
//                 </h2>
//                 <div
//                   className={`text-[13px] font-medium ${getStatusTagColor(
//                     task?.status
//                   )} px-4 py-0.5 rounded`}
//                 >
//                   {task?.status}
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <InfoBox label="Description" value={task?.description} />
//               </div>

//               <div className="grid grid-cols-12 gap-4 mt-4">
//                 <div className="col-span-6 md:col-span-4">
//                   <InfoBox label="Priority" value={task?.priority} />
//                 </div>
//                 <div className="col-span-6 md:col-span-4">
//                   <InfoBox
//                     label="Due Date"
//                     value={
//                       task?.dueDate
//                         ? moment(task?.dueDate).format("Do MMM YYYY")
//                         : "N/A"
//                     }
//                   />
//                 </div>
// <div className="col-span-6 md:col-span-4">
//   <InfoBox
//     label="Assigned To"
//     value={
//       task?.assignedTo?.map((user) => user.name).join(", ") || "N/A"
//     }
//   />
// </div>
//               </div>

//               <div className="mt-2">
//                 <label className="text-xs font-medium text-slate-500">
//                   Todo Checklist
//                 </label>
//                 {task?.todoChecklist?.map((item, index) => (
//                   <TodoChecklist
//                     key={`todo_${index}`}
//                     text={item.text}
//                     isChecked={item?.completed}
//                     onChange={() => updateTodocheclist(index)}
//                   />
//                 ))}
//               </div>

//               {task?.attachments?.length > 0 && (
//                 <div className="mt-2">
//                   <label className="text-xs font-medium text-slate-500">
//                     Attachments
//                   </label>
//                   {task?.attachments?.map((link, index) => (
//                     <Attachment
//                       key={`link_${index}`}
//                       link={link}
//                       index={index}
//                       onClick={() => handleLinkClick(link)}
//                     />
//                   ))}
//                 </div>
//               )}

//               {/* START: ADDED REMARKS SECTION */}
//               {task?.remarks?.length > 0 && (
//                 <div className="mt-4">
//                   <label className="text-sm font-medium text-slate-600">
//                     Remarks
//                   </label>
//                   <div className="mt-2 space-y-3">
//                     {task.remarks.map((remark) => (
//                       <RemarkCard key={remark._id} remark={remark} />
//                     ))}
//                   </div>
//                 </div>
//               )}
//               {/* END: ADDED REMARKS SECTION */}

//               <CommentSection 
//                         taskId={id}
//                         comments={task.comments}
//                         onCommentAdded={(updatedTask) => setTask(updatedTask)} // This refreshes the page with the new comment
//                     />

//             </div>
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// };

// export default ViewTaskDetails;

// const InfoBox = ({ label, value }) => {
//   return (
//     <>
//       <label className="text-xs font-medium text-slate-500">{label}</label>
//       <p className="text-[13px] md:text-[13px] font-medium text-gray-700 mt-0.5">
//         {value}
//       </p>
//     </>
//   );
// };

// const TodoChecklist = ({ text, isChecked, onChange }) => {
//   return (
//     <div className="flex items-center gap-3 p-3">
//       <input
//         type="checkbox"
//         checked={isChecked}
//         onChange={onChange}
//         className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
//       />
//       <p className="text-[13px] text-gray-800">{text}</p>
//     </div>
//   );
// };

// const Attachment = ({ link, index, onClick }) => {
//   return (
//     <div
//       className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer"
//       onClick={onClick}
//     >
//       <div className="flex-1 flex items-center gap-3">
//         <span className="text-xs text-gray-400 font-semibold mr-2">
//           {index < 9 ? `0${index + 1}` : index + 1}
//         </span>
//         <p className="text-xs text-black">{link}</p>
//       </div>
//       <LuSquareArrowOutUpRight className="text-gray-400" />
//     </div>
//   );
// };


// // START: NEW COMPONENT FOR DISPLAYING REMARKS
// const RemarkCard = ({ remark }) => {
//   return (
//     <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-md">
//       <div className="flex items-start gap-3">
//         {/* Profile Image */}
//         <img
//           src={remark.madeBy?.profileImageUrl || '/path/to/default/avatar.png'} // Fallback to a default avatar
//           alt={remark.madeBy?.name}
//           className="w-9 h-9 rounded-full object-cover"
//         />
//         <div className="flex-1">
//           <div className="flex items-center justify-between">
//             {/* User Name */}
//             <p className="text-sm font-semibold text-gray-800">
//               {remark.madeBy?.name || 'Unknown User'}
//             </p>
//             {/* Timestamp */}
//             <p className="text-xs text-gray-500">
//               {moment(remark.createdAt).fromNow()}
//             </p>
//           </div>
//           {/* Remark Text */}
//           <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
//             {remark.text}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
// // END: NEW COMPONENT


// import React from 'react';
// import CelebrationOverlay from '../../components/CelebrationOverlay';
// import { useState, useEffect, useContext,useCallback  } from 'react';
// import { useParams } from 'react-router-dom';
// import axiosInstance from '../../utils/axiosinstance';
// import { API_PATHS } from '../../utils/apiPaths';
// import DashboardLayout from '../../components/layouts/DashboardLayout';
// import moment from 'moment';
// import toast from 'react-hot-toast';
// import { UserContext } from '../../context/userContext';
// import CommentSection from '../../components/CommentSection';
// import { LuSquareArrowOutUpRight } from 'react-icons/lu';
// import ReviewSection from '../../components/ReviewSection';



// // =================================================================================
// // == Main ViewTaskDetails Component
// // =================================================================================
// const ViewTaskDetails = () => {
//     const { id } = useParams();
//     const [task, setTask] = useState(null);
//     const { user: currentUser, socket } = useContext(UserContext);

//     const [showCelebration, setShowCelebration] = useState(false);


//     const getStatusTagColor = (status) => {
//         switch (status) {
//             case "In Progress":
//                 return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
//             case "Completed":
//                 return "text-lime-500 bg-lime-50 border border-lime-500/20";
//             default:
//                 return "text-violet-500 bg-violet-50 border border-violet-500/10";
//         }
//     };

//     const getTaskDetailsById = useCallback(async () => {
//         if (!id) return;
//         try {
//             const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));
//             if (response.data) {
//                 setTask(response.data);
//             }
//         } catch (error) {
//             console.error("Error fetching task", error);
//             toast.error("Could not load task details.");
//         }
//     }, [id]);

//     const handleSubmitForReview = async () => {
//         if (!task) return;
//         try {
//             await axiosInstance.put(API_PATHS.TASKS.SUBMIT_FOR_REVIEW(task._id));
//             toast.success("Task submitted for review!");
//             getTaskDetailsById(); // Re-fetch to get the latest state
//         } catch (error) {
//             toast.error(error.response?.data?.message || "Failed to submit for review.");
//         }
//     };

// const updateTodocheclist = async (index) => {
//     if (!task || !currentUser) return;

//     // ... (Your permission check 'canEdit' is correct)

//     const originalChecklist = JSON.parse(JSON.stringify(task.todoChecklist));
//     const newChecklist = [...originalChecklist];

//     if (newChecklist[index]) {
//         newChecklist[index].completed = !newChecklist[index].completed;
//         setTask(prev => ({ ...prev, todoChecklist: newChecklist }));

//         try {
//             const response = await axiosInstance.put(
//                 API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(id),
//                 { todoChecklist: newChecklist }
//             );

//             // --- START: Corrected Section ---
//             // 1. Store the authoritative task from the backend in a variable
//             const updatedTask = response.data?.task;

//             // 2. Update the main task state with the new data
//             if (updatedTask) {
//                setTask(updatedTask);
//             }

//             // 3. Now, safely use the 'updatedTask' variable for your check
//             if (updatedTask && updatedTask.status === 'Completed' && updatedTask.title.includes('[Milestone]')) {
//                     console.log("✅ CHECKPOINT 1: Milestone completed! Triggering celebration.");
//                     setShowCelebration(true);
//                     setTimeout(() => setShowCelebration(false), 4000);
//                 }

//         } catch (error) {
//             console.error("Error updating checklist:", error);
//             toast.error(error.response?.data?.message || "Couldn't save progress.");
//             setTask(prev => ({ ...prev, todoChecklist: originalChecklist }));
//         }
//     }
// };

//     const handleLinkClick = (link) => {
//         if (!/^https?:\/\//i.test(link)) {
//             link = "https://" + link;
//         }
//         window.open(link, "_blank");
//     };

//     useEffect(() => {
//         getTaskDetailsById();
//     }, [getTaskDetailsById]);
    
//     useEffect(() => {
//         if (socket) {
//             socket.on('new_comment', (data) => {
//                 if (data.taskId === id) {
//                     setTask(prevTask => ({
//                         ...prevTask,
//                         comments: [...prevTask.comments, data.comment]
//                     }));
//                 }
//             });
//         }
//         return () => {
//             if (socket) {
//                 socket.off('new_comment');
//             }
//         };
//     }, [socket, id]);
//     console.log("✅ CHECKPOINT 2: Rendering component. 'showCelebration' is currently:", showCelebration);

//     return (
//         <>
//             <div className="mt-5">
//                 {task ? (
//                     <div className="grid grid-cols-1 md:grid-cols-4 mt-4 gap-6">
//                         <div className="form-card col-span-3">
//                             <div className="flex items-center justify-between">
//                                 <h2 className="text-xl md:text-xl font-medium">{task.title}</h2>
//                                 <div className={`text-[13px] font-medium ${getStatusTagColor(task.status)} px-4 py-0.5 rounded`}>
//                                     {task.status}
//                                 </div>
//                             </div>

//                             <div className="mt-4"><InfoBox label="Description" value={task.description} /></div>

//                             <div className="grid grid-cols-12 gap-4 mt-4">
//                                 <div className="col-span-12 md:col-span-4">
//                                     <InfoBox label="Project" value={task.project?.name} />
//                                 </div>
//                                 <div className="col-span-6 md:col-span-4"><InfoBox label="Priority" value={task.priority} /></div>
//                                 <div className="col-span-6 md:col-span-4">
//                                     <InfoBox label="Due Date" value={task.dueDate ? moment(task.dueDate).format("Do MMM YYYY") : "N/A"}/>
//                                 </div>
//                                 <div className="col-span-12">
//                                     <InfoBox label="Assigned To" value={task.assignedTo?.map((user) => user.name).join(", ") || "N/A"}/>
//                                 </div>
//                             </div>

//                             <div className="mt-4">
//                                 <label className="text-xs font-medium text-slate-500">Todo Checklist</label>
//                                 {task.todoChecklist?.map((item, index) => (
//                                     <TodoChecklist key={item._id || `todo_${index}`} text={item.text} isChecked={item.completed} onChange={() => updateTodocheclist(index)} />
//                                 ))}
//                             </div>

//                             {task.attachments?.length > 0 && (
//                                 <div className="mt-4">
//                                     <label className="text-xs font-medium text-slate-500">Attachments</label>
//                                     {task.attachments.map((link, index) => (
//                                         <Attachment key={`link_${index}`} link={link} index={index} onClick={() => handleLinkClick(link)} />
//                                     ))}
//                                 </div>
//                             )}

//                             {task.remarks?.length > 0 && (
//                                 <div className="mt-4">
//                                     <label className="text-sm font-medium text-slate-600">Remarks</label>
//                                     <div className="mt-2 space-y-3">
//                                         {task.remarks.map((remark) => (
//                                             <RemarkCard key={remark._id} remark={remark} />
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}

//                             <ReviewSection 
//                                 task={task} 
//                                 onTaskReviewed={getTaskDetailsById} 
//                                 onSubmitForReview={handleSubmitForReview} 
//                             />

//                             <CommentSection
//                                 taskId={id}
//                                 comments={task.comments}
//                                 onCommentAdded={(updatedTask) => setTask(updatedTask)}
//                             />
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="text-center py-20">Loading task details...</div>
//                 )}
//             </div>
//              {showCelebration && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//                     {/* --- CHECKPOINT 3: Check if the GIF is trying to render --- */}
//                     {console.log("✅ CHECKPOINT 3: Rendering the celebration GIF!")}
//                     <img 
//                         src="/my-celebration.gif" 
//                         alt="Celebration" 
//                         className="w-64 h-64"
//                     />
//                 </div>
//             )}
//         </>
//     );
// };

// // =================================================================================
// // == Sub-Components
// // =================================================================================
// const InfoBox = ({ label, value }) => {
//     return (
//         <div>
//             <label className="text-xs font-medium text-slate-500">{label}</label>
//             <p className="text-[13px] font-medium text-gray-700 mt-0.5">{value}</p>
//         </div>
//     );
// };

// const TodoChecklist = ({ text, isChecked, onChange }) => {
//     return (
//         <div className="flex items-center gap-3 p-3 border-b border-gray-100">
//             <input type="checkbox" checked={isChecked} onChange={onChange} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer" />
//             <p className="text-[13px] text-gray-800">{text}</p>
//         </div>
//     );
// };

// const Attachment = ({ link, index, onClick }) => {
//     return (
//         <div className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer hover:bg-gray-100" onClick={onClick}>
//             <div className="flex-1 flex items-center gap-3">
//                 <span className="text-xs text-gray-400 font-semibold mr-2">{index < 9 ? `0${index + 1}` : index + 1}</span>
//                 <p className="text-xs text-black">{link}</p>
//             </div>
//             <LuSquareArrowOutUpRight className="text-gray-400" />
//         </div>
//     );
// };

// const RemarkCard = ({ remark }) => {
//     return (
//         <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-md">
//             <div className="flex items-start gap-3">
//                 <img
//                     src={remark.madeBy?.profileImageUrl || `https://ui-avatars.com/api/?name=${(remark.madeBy?.name || 'U').replace(/\s/g, '+')}`}
//                     alt={remark.madeBy?.name}
//                     className="w-9 h-9 rounded-full object-cover"
//                 />
//                 <div className="flex-1">
//                     <div className="flex items-center justify-between">
//                         <p className="text-sm font-semibold text-gray-800">{remark.madeBy?.name || 'Unknown User'}</p>
//                         <p className="text-xs text-gray-500">{moment(remark.createdAt).fromNow()}</p>
//                     </div>
//                     <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{remark.text}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ViewTaskDetails;

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS, BASE_URL } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import moment from 'moment';
import { UserContext } from '../../context/userContext';

// Components
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import CelebrationOverlay from '../../components/CelebrationOverlay';

// Icons
import { LuSquareArrowOutUpRight, LuPanelRightClose, LuPanelLeftClose } from 'react-icons/lu';
import { LuVideo, LuImage, LuLayers, LuUpload, LuLayoutGrid, LuExternalLink } from 'react-icons/lu';
import { MdCheckCircle, MdOutlineRadioButtonUnchecked } from 'react-icons/md';


// =================================================================================
// == Main ViewTaskDetails Component
// =================================================================================
const ViewTaskDetails = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const navigate = useNavigate();
    const { user: currentUser, socket } = useContext(UserContext);
    const [isCommentsOpen, setIsCommentsOpen] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [uploading, setUploading] = useState(false);

    const getStatusTagColor = (status) => {
        switch (status) {
            case "In Progress": return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
            case "Completed": return "text-lime-500 bg-lime-50 border border-lime-500/20";
            default: return "text-violet-500 bg-violet-50 border border-violet-500/10";
        }
    };

    const getTaskDetailsById = useCallback(async () => {
        if (!id) return;
        try {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));
            if (response.data) {
                setTask(response.data);
            }
        } catch (error) {
            console.error("Error fetching task", error);
            toast.error("Could not load task details.");
        }
    }, [id]);

    const handleSubmitForReview = async () => {
        if (!task) return;
        try {
            await axiosInstance.put(API_PATHS.TASKS.SUBMIT_FOR_REVIEW(task._id));
            toast.success("Task submitted for review!");
            getTaskDetailsById();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit for review.");
        }
    };

    const updateTodocheclist = async (index) => {
        if (!task || !currentUser) return;
        const originalChecklist = JSON.parse(JSON.stringify(task.todoChecklist));
        const newChecklist = [...originalChecklist];
        if (newChecklist[index]) {
            newChecklist[index].completed = !newChecklist[index].completed;
            setTask(prev => ({ ...prev, todoChecklist: newChecklist }));
            try {
                const response = await axiosInstance.put(
                    API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(id),
                    { todoChecklist: newChecklist }
                );
                const updatedTask = response.data?.task;
                if (updatedTask) {
                   setTask(updatedTask);
                }
                if (updatedTask && updatedTask.status === 'Completed' && updatedTask.title.includes('[Milestone]')) {
                        setShowCelebration(true);
                        setTimeout(() => setShowCelebration(false), 4000);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Couldn't save progress.");
                setTask(prev => ({ ...prev, todoChecklist: originalChecklist }));
            }
        }
    };

    const handleLinkClick = (link) => {
        if (!/^https?:\/\//i.test(link)) {
            link = "https://" + link;
        }
        window.open(link, "_blank");
    };
    const handleSocialUpload = async (e, isCoverOnly = false) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            // 1. Upload Files
            const uploadRes = await axiosInstance.post(API_PATHS.SOCIAL.UPLOAD, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newFiles = uploadRes.data.files.map(f => ({
                url: f.filePath, 
                mimeType: f.mimeType,
                originalName: f.originalName
            }));

            // 2. Prepare Payload
            const payload = {};

            if (isCoverOnly) {
                // COVER LOGIC: Just update the display image, don't add to media list
                payload.gridDisplayImage = newFiles[0].url;
            } else {
                // STANDARD LOGIC: Append to gallery + Auto-detect type
                const currentFiles = task.socialMeta?.mediaFiles || [];
                const updatedFiles = [...currentFiles, ...newFiles];
                
                payload.mediaFiles = updatedFiles;
                
                // Auto-detect logic
                if (updatedFiles.length > 1) payload.postType = 'carousel';
                else if (updatedFiles.length === 1 && updatedFiles[0].mimeType.includes('video')) payload.postType = 'reel';
                else payload.postType = 'static';

                // If no cover existed, use the first file
                if (!task.socialMeta?.gridDisplayImage && updatedFiles.length > 0) {
                    payload.gridDisplayImage = updatedFiles[0].url;
                }
            }

            // 3. Save
            await axiosInstance.put(API_PATHS.SOCIAL.UPDATE_TASK(task._id), payload);

            toast.success(isCoverOnly ? "Cover updated!" : "Media added!");
            getTaskDetailsById(); 

        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // --- NEW: NAVIGATE TO GRID ---
    const goToSocialGrid = () => {
        if (task?.project?._id) {
            navigate(`/projects/${task.project._id}/social`);
        } else {
            toast.error("Project not found");
        }
    };

    useEffect(() => {
        getTaskDetailsById();
    }, [getTaskDetailsById]);

    useEffect(() => {
        if (socket) {
            socket.on('new_comment', (data) => {
                if (data.taskId === id) {
                    setTask(prevTask => ({
                        ...prevTask,
                        comments: [...prevTask.comments, data.comment]
                    }));
                }
            });
        }
        return () => {
            if (socket) {
                socket.off('new_comment');
            }
        };
    }, [socket, id]);

    if (!task) {
        return <div className="p-6 text-center">Loading task details...</div>;
    }

    return (
        <div className="flex gap-4 items-start">
            {/* --- Main Content Area (Left Column) --- */}
            <div className="flex-1 min-w-0">
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl md:text-xl font-medium">{task.title}</h2>
                        <div className={`text-[13px] font-medium ${getStatusTagColor(task.status)} px-4 py-0.5 rounded`}>
                            {task.status}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <InfoBox label="Description" value={task.description} />
                        {/* --- NEW: SOCIAL CONTENT PREVIEW --- */}
{task.isSocialPost && (
                        <div className="mb-6 border rounded-lg overflow-hidden border-slate-200">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-700">Social Media Asset</h3>
                                    <span className="text-[10px] bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">
                                        {task.socialMeta?.platform} • {task.socialMeta?.postType}
                                    </span>
                                </div>
                                <div className="flex gap-2">
    {/* Standard Upload Button */}
    <label className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 px-3 py-1.5 rounded cursor-pointer hover:bg-slate-50 hover:text-primary transition-colors font-medium">
        <LuUpload size={14} /> 
        {uploading ? "Uploading..." : "Add Media"}
        {/* Pass false for normal upload */}
        <input 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => handleSocialUpload(e, false)} 
            disabled={uploading} 
        />
    </label>
    
    {/* NEW: Reel Cover Button (Only visible for Reels) */}
    {task.socialMeta?.postType === 'reel' && (
        <label className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1.5 rounded cursor-pointer hover:bg-purple-100 transition-colors font-medium" title="Set a specific cover image for the grid">
            <LuImage size={14} /> Set Cover
            {/* Pass true for cover-only upload */}
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleSocialUpload(e, true)} 
                disabled={uploading} 
            />
        </label>
    )}
    
    {/* Go to Grid Button */}
    <button 
        onClick={goToSocialGrid}
        className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition-colors font-medium"
    >
        <LuLayoutGrid size={14} /> Open Planner
    </button>
</div>
                            </div>
                            
                            <div className="p-4 bg-white flex gap-4 overflow-x-auto min-h-[100px] items-center">
                                {task.socialMeta?.mediaFiles?.length > 0 ? (
                                    task.socialMeta.mediaFiles.map((file, idx) => (
                                        <div key={idx} className="w-32 h-32 flex-shrink-0 bg-slate-50 border rounded-lg overflow-hidden relative shadow-sm group">
                                            {file.mimeType?.includes('video') ? (
                                                <video src={`${BASE_URL}${file.url}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={`${BASE_URL}${file.url}`} alt="Social Content" className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm">
                                                {file.mimeType?.includes('video') ? <LuVideo size={12}/> : <LuImage size={12}/>}
                                            </div>
                                            <a 
                                                href={`${BASE_URL}${file.url}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs"
                                            >
                                                <LuExternalLink className="mr-1" /> View
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-slate-400 italic w-full text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                                        No visual content uploaded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                        <InfoBox label="Priority" value={task.priority} />
                        <InfoBox label="Due Date" value={task.dueDate ? moment(task.dueDate).format("Do MMM YYYY") : "N/A"} />
                        <InfoBox label="Assigned To" value={task.assignedTo?.map((user) => user.name).join(", ") || "N/A"} />
                    </div>
                    
                    <div className="mt-4">
                        <label className="text-sm font-medium text-slate-500">Todo Checklist</label>
                        {task.todoChecklist?.map((item, index) => (
                            <TodoChecklist key={item._id || `todo_${index}`} text={item.text} isChecked={item.completed} onChange={() => updateTodocheclist(index)} />
                        ))}
                    </div>

                    {task.attachments?.length > 0 && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-slate-500">Attachments</label>
                            {task.attachments.map((link, index) => (
                                <Attachment key={`link_${index}`} link={link} index={index} onClick={() => handleLinkClick(link)} />
                            ))}
                        </div>
                    )}

                    {task.remarks?.length > 0 && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-slate-600">Remarks</label>
                            <div className="mt-2 space-y-3">
                                {task.remarks.map((remark) => (
                                    <RemarkCard key={remark._id} remark={remark} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <ReviewSection 
                        task={task} 
                        onTaskReviewed={getTaskDetailsById} 
                        onSubmitForReview={handleSubmitForReview} 
                    />
                </div>
            </div>

            {/* --- Collaboration Sidebar (Right Column) --- */}
            <div className="relative">
                <button 
                    onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                    className="absolute -left-4 top-5 z-20 bg-white border border-slate-200 rounded-full p-1.5 text-slate-500 hover:text-primary hover:bg-slate-50 shadow"
                    title={isCommentsOpen ? "Hide Comments" : "Show Comments"}
                >
                    {isCommentsOpen ? <LuPanelRightClose size={20}/> : <LuPanelLeftClose size={20}/>}
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${isCommentsOpen ? 'w-96' : 'w-0'}`} style={{ transition: 'width 300ms' }}>
                    <div className="overflow-hidden h-full">
                        <CommentSection
                            taskId={id}
                            comments={task.comments}
                            onCommentAdded={(updatedTask) => setTask(updatedTask)}
                        />
                    </div>
                </div>
            </div>
            
            <CelebrationOverlay isOpen={showCelebration} onClose={() => setShowCelebration(false)} />
        </div>
    );
};

// =================================================================================
// == Sub-Components
// =================================================================================
const InfoBox = ({ label, value }) => (
    <div>
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <p className="text-[13px] font-medium text-gray-700 mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
);

const TodoChecklist = ({ text, isChecked, onChange }) => (
    <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <input type="checkbox" checked={isChecked} onChange={onChange} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer" />
        <p className={`text-[13px] ${isChecked ? 'line-through text-slate-400' : 'text-gray-800'}`}>{text}</p>
    </div>
);

const Attachment = ({ link, index, onClick }) => (
    <div className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer hover:bg-gray-100" onClick={onClick}>
        <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold mr-2">{index < 9 ? `0${index + 1}` : index + 1}</span>
            <p className="text-xs text-black">{link}</p>
        </div>
        <LuSquareArrowOutUpRight className="text-gray-400" />
    </div>
);

const RemarkCard = ({ remark }) => (
    <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-md">
        <div className="flex items-start gap-3">
            <img src={remark.madeBy?.profileImageUrl || `https://ui-avatars.com/api/?name=${(remark.madeBy?.name || 'U').replace(/\s/g, '+')}`} alt={remark.madeBy?.name} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{remark.madeBy?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">{moment(remark.createdAt).fromNow()}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{remark.text}</p>
            </div>
        </div>
    </div>
);

export default ViewTaskDetails;
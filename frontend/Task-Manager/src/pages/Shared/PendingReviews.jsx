import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';
import { 
    LuCheck, LuClock, LuFileText, LuUser, LuArrowRight, 
    LuHistory, LuMessageSquare, LuCornerUpLeft, LuX, LuHourglass, LuUsers
} from 'react-icons/lu';

// Helper for Urgency (Queue Tab)
const getUrgencyColor = (updatedAt) => {
    const daysWaiting = moment().diff(moment(updatedAt), 'days');
    if (daysWaiting >= 5) return { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700', text: 'Critical Wait' };
    if (daysWaiting >= 2) return { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-700', text: 'Warning' };
    return { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', text: 'New Request' };
};

const PendingReviews = () => {
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'pipeline' | 'history'
    const [reviews, setReviews] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const [queueRes, pipelineRes, historyRes] = await Promise.all([
                axiosInstance.get(API_PATHS.TASKS.GET_MY_PENDING_REVIEWS),
                axiosInstance.get(API_PATHS.TASKS.GET_UPCOMING_REVIEWS),
                axiosInstance.get(API_PATHS.TASKS.GET_MY_REVIEW_HISTORY)
            ]);
            setReviews(queueRes.data);
            setPipeline(pipelineRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error("Failed to fetch reviews", err);
            toast.error("Could not load review data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // Action Handler (Approve, Reject, Reopen)
    const handleQuickAction = async (e, task, action) => {
        e.stopPropagation();
        let comment = "";
        if (action === 'ChangesRequested') {
            comment = window.prompt(task.reviewStatus === 'Approved' ? "Reason for reopening?" : "What changes are needed?");
            if (comment === null) return;
            if (!comment.trim()) return toast.error("Comment required.");
        }

        const endpoint = task.reviewStatus === 'PendingReview' 
            ? API_PATHS.TASKS.PROCESS_REVIEW(task._id) 
            : API_PATHS.TASKS.FINAL_APPROVE_TASK(task._id);

        try {
            await axiosInstance.put(endpoint, { decision: action, reviewComment: comment });
            toast.success("Updated successfully!");
            fetchReviews();
        } catch (err) {
            toast.error("Action failed.");
        }
    };

    // 1. QUEUE TAB (Action Required)
    const renderQueue = () => (
        <div className="space-y-4">
            {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <LuCheck className="text-3xl text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">All Caught Up!</h3>
                    <p className="text-slate-500">No pending approvals.</p>
                </div>
            ) : (
                reviews.map(task => {
                    const urgency = getUrgencyColor(task.updatedAt);
                    const lastComment = task.comments?.[0];
                    return (
                        <div key={task._id} onClick={() => navigate(`/user/task-details/${task._id}`)} className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col md:flex-row relative pl-1 ${urgency.border}`} style={{ borderLeftWidth: '6px' }}>
                            <div className="p-5 flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${urgency.badge}`}>{urgency.text}</span>
                                    {task.revisionCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Rev #{task.revisionCount}</span>}
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 ml-auto"><LuFileText /> {task.project?.name}</span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors mb-2">{task.title}</h4>
                                {lastComment && (
                                    <div className="mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex gap-3">
                                        <div className="mt-0.5"><LuMessageSquare className="text-slate-400 text-xs" /></div>
                                        <p className="text-xs text-slate-500 italic line-clamp-1"><span className="font-semibold">{lastComment.madeBy?.name}:</span> "{lastComment.text}"</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                    <span className="font-medium">Submitted by:</span> {task.assignedTo?.map(u => u.name).join(', ')}
                                    <span className="mx-2">•</span>
                                    <LuClock /> {moment(task.updatedAt).fromNow()}
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col border-t md:border-t-0 md:border-l border-slate-200 divide-x md:divide-x-0 md:divide-y divide-slate-200 bg-slate-50">
                                <button onClick={(e) => handleQuickAction(e, task, 'Approved')} className="flex-1 p-4 flex flex-col items-center justify-center gap-1 hover:bg-green-50 text-green-600 transition-colors group/btn" title="Approve">
                                    <div className="p-2 bg-white rounded-full border border-green-200 group-hover/btn:bg-green-500 group-hover/btn:text-white transition-all shadow-sm"><LuCheck size={18} /></div>
                                    <span className="text-[10px] font-bold uppercase">Approve</span>
                                </button>
                                <button onClick={(e) => handleQuickAction(e, task, 'ChangesRequested')} className="flex-1 p-4 flex flex-col items-center justify-center gap-1 hover:bg-red-50 text-red-600 transition-colors group/btn" title="Request Changes">
                                    <div className="p-2 bg-white rounded-full border border-red-200 group-hover/btn:bg-red-500 group-hover/btn:text-white transition-all shadow-sm"><LuX size={18} /></div>
                                    <span className="text-[10px] font-bold uppercase">Changes</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    // 2. PIPELINE TAB (Coming Soon)
    const renderPipeline = () => (
        <div className="space-y-3">
            {pipeline.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">No upcoming reviews.</div>
            ) : (
                pipeline.map(task => (
                    <div key={task._id} onClick={() => navigate(`/user/task-details/${task._id}`)} className="group bg-white/60 rounded-lg border border-slate-200 p-4 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-slate-700 group-hover:text-primary transition-colors">{task.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                    <LuFileText size={12} /> {task.project?.name} 
                                    <span className="text-slate-300">|</span>
                                    Due {moment(task.dueDate).format('MMM D')}
                                </p>
                            </div>
                            <div className="text-right">
                                {/* Status Logic: Who are we waiting for? */}
                                {task.reviewStatus === 'PendingReview' ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">
                                        <LuUsers size={12} /> With Reviewers
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                        <LuUser size={12} /> With Assignee
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex gap-1">
                            Waiting on: 
                            <span className="font-semibold text-slate-700">
                                {task.reviewStatus === 'PendingReview' 
                                    ? task.reviewers?.map(u => u.name).join(', ') 
                                    : task.assignedTo?.map(u => u.name).join(', ')
                                }
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // 3. HISTORY TAB (Past)
    const renderHistory = () => (
        <div className="space-y-3">
            {history.length === 0 ? <div className="text-center py-10 text-slate-400">No history found.</div> : (
                history.map(task => (
                    <div key={task._id} onClick={() => navigate(`/user/task-details/${task._id}`)} className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-10 rounded-full ${task.reviewStatus === 'Approved' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                            <div>
                                <h5 className="font-medium text-slate-700 group-hover:text-primary transition-colors">{task.title}</h5>
                                <p className="text-xs text-slate-400 mt-1">{task.project?.name} • {moment(task.updatedAt).format('MMM D')}</p>
                            </div>
                        </div>
                        {task.reviewStatus === 'Approved' && (
                            <button onClick={(e) => handleQuickAction(e, task, 'ChangesRequested')} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-md border border-slate-200 transition-colors">
                                <LuCornerUpLeft /> Reopen
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    return (
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Approvals Center</h2>
                        <p className="text-slate-500 text-sm">Manage reviews and track incoming work.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <TabButton label="Queue" count={reviews.length} active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} />
                        <TabButton label="Pipeline" count={pipeline.length} active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} icon={<LuHourglass />} />
                        <TabButton label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<LuHistory />} />
                    </div>
                </div>

                {loading ? <div className="text-center py-20 text-slate-400">Loading...</div> : (
                    activeTab === 'queue' ? renderQueue() : activeTab === 'pipeline' ? renderPipeline() : renderHistory()
                )}
            </div>
    );
};

const TabButton = ({ label, count, active, onClick, icon }) => (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        {icon} {label} {count > 0 && <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>}
    </button>
);

export default PendingReviews;
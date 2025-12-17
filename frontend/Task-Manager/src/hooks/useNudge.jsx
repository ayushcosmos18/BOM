import { useState, useContext } from 'react';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../context/userContext';

const useNudge = () => {
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useContext(UserContext);

    const nudgeTask = async (task) => {
        if (loading) return;
        
        // 1. Optimistic Permission Check
        const isAdmin = currentUser?.role === 'admin';
        const isReviewer = task.reviewers?.some(r => 
            (typeof r === 'string' ? r : r._id) === currentUser?._id
        );

        if (!isAdmin && !isReviewer) {
            toast.error("Only Reviewers or Admins can nudge.");
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post(API_PATHS.TASKS.NUDGE(task._id));
            toast.success("Nudge sent successfully!");
        } catch (error) {
            if (error.response?.status === 429) {
                toast.error("Already nudged recently. Please wait.");
            } else {
                toast.error(error.response?.data?.message || "Failed to send nudge.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { nudgeTask, loading };
};

export default useNudge;
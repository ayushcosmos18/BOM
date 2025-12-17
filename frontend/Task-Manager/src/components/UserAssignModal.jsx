import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import SelectUsers from './Inputs/SelectUsers';
import axiosInstance from '../utils/axiosinstance';
import { API_PATHS } from '../utils/apiPaths';
import toast from 'react-hot-toast';

const UserAssignModal = ({ isOpen, onClose, sourceTask, onSave }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users to populate the modal
  useEffect(() => {
    if (isOpen) {
      const fetchAllUsers = async () => {
        try {
          const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
          setAllUsers(response.data.users || response.data || []);
        } catch (error) {
          toast.error("Could not load users list.");
        }
      };
      fetchAllUsers();
    }
  }, [isOpen]);

  const handleSelect = (role) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    // Call the onSave function passed from ProjectWorkMap
    onSave(selectedUsers, role);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Connect Users to "${sourceTask?.data?.title}"`}>
      <p className="text-sm text-slate-600 mb-4">
        Select one or more users to connect to this task. Users not already in this project will be added automatically.
      </p>
      
      {/* Set a min-height to ensure SelectUsers renders properly inside the modal */}
      <div style={{ minHeight: '300px' }}>
        <SelectUsers
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button className="card-btn" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="add-btn" 
          onClick={() => handleSelect('assign')}
          disabled={selectedUsers.length === 0}
        >
          Assign
        </button>
        <button 
          className="add-btn bg-orange-100 text-orange-700 hover:bg-orange-200" 
          onClick={() => handleSelect('review')}
          disabled={selectedUsers.length === 0}
        >
          Add as Reviewer
        </button>
      </div>
    </Modal>
  );
};

export default UserAssignModal;
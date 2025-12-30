import React, { useRef, useState, useEffect } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";
import { BASE_URL } from "../../../utils/apiPaths"; // Import BASE_URL

const ProfilePhotoSelector = ({ image, setImage }) => {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // --- FIX: Handle both new files and existing URL strings ---
    useEffect(() => {
        if (typeof image === 'string') {
            // It's a URL (from DB)
            if (image.startsWith('http')) {
                setPreviewUrl(image); // Cloudinary
            } else {
                setPreviewUrl(`${BASE_URL}${image}`); // Local path (legacy)
            }
        } else if (image instanceof File) {
            // It's a new file upload
            const objectUrl = URL.createObjectURL(image);
            setPreviewUrl(objectUrl);
            
            // Cleanup memory
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [image]);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file); // This triggers the useEffect above
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
    };

    const onChooseFile = () => {
        inputRef.current.click();
    };

    return (
        <div className="flex justify-center mb-6">
            <input 
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleImageChange}
                className="hidden" // Hiding the ugly input
            />

            {!previewUrl ? (
                <div className="w-20 h-20 flex items-center justify-center bg-blue-100/50 rounded-full relative cursor-pointer group">
                    <LuUser className="text-4xl text-primary" />
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute -bottom-1 -right-1 cursor-pointer hover:bg-primary/90 transition-colors"
                        onClick={onChooseFile}
                    >
                        <LuUpload size={14} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <img
                        src={previewUrl}
                        alt="profile photo"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1 hover:bg-red-600 transition-colors"
                        onClick={handleRemoveImage}
                    >
                        <LuTrash size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoSelector;
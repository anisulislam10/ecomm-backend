const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

// Multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif|webp|avif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed'));
    }
};

// Upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    },
    fileFilter: fileFilter
});

/**
 * @desc    Upload single image to Cloudinary
 */
exports.uploadSingleImage = async (file, folder = 'products') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) {
                    reject(new ApiError(500, 'Failed to upload image'));
                } else {
                    resolve({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                }
            }
        );

        stream.end(file.buffer);
    });
};

/**
 * @desc    Upload multiple images to Cloudinary
 */
exports.uploadMultipleImages = async (files, folder = 'products') => {
    const uploadPromises = files.map(file => this.uploadSingleImage(file, folder));
    return await Promise.all(uploadPromises);
};

/**
 * @desc    Delete image from Cloudinary
 */
exports.deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new ApiError(500, 'Failed to delete image');
    }
};

module.exports.upload = upload;

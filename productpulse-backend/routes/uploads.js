const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');
const ctrl = require('../controllers/uploadController');

router.post('/',              protect, upload.single('file'), ctrl.uploadFile);
router.get ('/',              protect, ctrl.listUploads);
router.get ('/:id/status',   protect, ctrl.getUploadStatus);
router.get ('/:id/preview',  protect, ctrl.getUploadPreview);

module.exports = router;

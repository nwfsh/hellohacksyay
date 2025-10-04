class FolderUploader {
    constructor() {
        this.files = [];
        this.uploadArea = document.getElementById('uploadArea');
        this.folderInput = document.getElementById('folderInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileList = document.getElementById('fileList');
        this.fileItems = document.getElementById('fileItems');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.uploadResults = document.getElementById('uploadResults');
        this.resultsContent = document.getElementById('resultsContent');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Browse button
        this.browseBtn.addEventListener('click', () => {
            this.folderInput.click();
        });

        // Folder input change
        this.folderInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Upload button
        this.uploadBtn.addEventListener('click', () => {
            this.uploadFiles();
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearFiles();
        });
    }

    handleFiles(fileList) {
        this.files = Array.from(fileList);
        this.displayFiles();
        this.showFileList();
    }

    displayFiles() {
        this.fileItems.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const icon = this.getFileIcon(file);
            const size = this.formatFileSize(file.size);
            const path = file.webkitRelativePath || file.name;
            
            fileItem.innerHTML = `
                <i class="fas ${icon} file-icon"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-path">${path}</div>
                </div>
                <div class="file-size">${size}</div>
            `;
            
            this.fileItems.appendChild(fileItem);
        });
    }

    getFileIcon(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'txt': 'fa-file-alt',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'mp4': 'fa-file-video',
            'avi': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'js': 'fa-file-code',
            'json': 'fa-file-code',
            'xml': 'fa-file-code'
        };
        
        return iconMap[extension] || 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showFileList() {
        this.fileList.style.display = 'block';
        this.uploadProgress.style.display = 'none';
        this.uploadResults.style.display = 'none';
    }

    async uploadFiles() {
        if (this.files.length === 0) return;
        
        this.showProgress();
        this.resultsContent.innerHTML = '';
        
        let uploadedCount = 0;
        const totalFiles = this.files.length;
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            
            try {
                // Simulate upload process
                await this.simulateUpload(file);
                uploadedCount++;
                
                // Add success result
                this.addResult(file.name, 'success', 'Uploaded successfully');
                
            } catch (error) {
                // Add error result
                this.addResult(file.name, 'error', error.message);
            }
            
            // Update progress
            const progress = ((i + 1) / totalFiles) * 100;
            this.updateProgress(progress);
        }
        
        // Show results
        setTimeout(() => {
            this.showResults();
        }, 500);
    }

    simulateUpload(file) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            const delay = Math.random() * 2000 + 500;
            
            setTimeout(() => {
                // Simulate occasional failures
                if (Math.random() < 0.1) {
                    reject(new Error('Network error'));
                } else {
                    resolve();
                }
            }, delay);
        });
    }

    addResult(fileName, type, message) {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        resultItem.innerHTML = `
            <i class="fas ${icon} result-icon"></i>
            <div>
                <strong>${fileName}</strong><br>
                <small>${message}</small>
            </div>
        `;
        
        this.resultsContent.appendChild(resultItem);
    }

    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${Math.round(percentage)}%`;
    }

    showProgress() {
        this.uploadProgress.style.display = 'block';
        this.fileList.style.display = 'none';
        this.uploadResults.style.display = 'none';
    }

    showResults() {
        this.uploadProgress.style.display = 'none';
        this.uploadResults.style.display = 'block';
    }

    clearFiles() {
        this.files = [];
        this.folderInput.value = '';
        this.fileList.style.display = 'none';
        this.uploadProgress.style.display = 'none';
        this.uploadResults.style.display = 'none';
        this.fileItems.innerHTML = '';
        this.resultsContent.innerHTML = '';
    }
}

// Initialize the folder uploader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FolderUploader();
});

// Prevent default drag behaviors on the entire page
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

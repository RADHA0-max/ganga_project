document.addEventListener('DOMContentLoaded', () => {
    const verificationMethod = document.getElementById('verification-method');
    const verificationForm = document.getElementById('verification-form');
    
    // Specific form sections
    const experienceForm = document.getElementById('experience-form');
    const documentUploadForm = document.getElementById('document-upload-form');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('document-upload');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Listen for changes on the dropdown menu
    verificationMethod.addEventListener('change', (e) => {
        const selectedMethod = e.target.value;

        // Hide all specific form sections first
        experienceForm.classList.add('hidden');
        documentUploadForm.classList.add('hidden');

        if (!selectedMethod) {
            // If the user selects the placeholder, hide the main form
            verificationForm.classList.add('hidden');
            return;
        }

        // Show the correct form section based on selection
        if (selectedMethod === 'no-education') {
            experienceForm.classList.remove('hidden');
        } else {
            documentUploadForm.classList.remove('hidden');
        }
        
        // Show the main form container with the submit button
        verificationForm.classList.remove('hidden');
    });

    // Handle the click on the upload area to trigger the file input
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Display the chosen file name
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
        }
    });

    // Handle form submission for all verification paths
    verificationForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent actual form submission
        
        // In a real app, you would handle file upload or text submission here.
        // For this demo, we'll just show a success message and redirect.
        alert("Verification details submitted! Redirecting to the expert portal.");
        
        // Redirect to the main expert portal page after submission
        window.location.href = 'expert_portal.html';
    });
});


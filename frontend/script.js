document.addEventListener('DOMContentLoaded', () => {

    // --- STATE VARIABLE ---
    let selectedRoleUrl = '';

    // --- ELEMENT SELECTORS ---
    const discoverBtn = document.getElementById('discover-mission-btn');
    const userRoleCard = document.getElementById('user-role-card');
    const ngoRoleCard = document.getElementById('ngo-role-card');
    const expertRoleCard = document.getElementById('expert-role-card');
    
    const modalLinks = {
        about: document.getElementById('about-link'),
        mission: document.getElementById('mission-link'),
        contact: document.getElementById('contact-link')
    };

    const modals = {
        about: document.getElementById('about-modal'),
        missionText: document.getElementById('mission-text-modal'),
        rolePortal: document.getElementById('role-portal-modal'),
        contact: document.getElementById('contact-modal'),
        auth: document.getElementById('auth-modal'),
        message: document.getElementById('message-modal')
    };

    const overlay = document.getElementById('modal-overlay');
    const closeButtons = document.querySelectorAll('.close-btn');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authButton = document.getElementById('auth-button');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const confirmPasswordField = document.getElementById('confirm-password');
    const authToggleLinkContainer = document.querySelector('.auth-toggle-link');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const messageOkBtn = document.getElementById('message-ok-btn');

    // --- MODAL FUNCTIONS ---
    const openModal = (modal) => {
        if (modal == null) return;
        modal.classList.add('active');
        overlay.classList.add('active');
    };

    const closeModal = () => {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => modal.classList.remove('active'));
        overlay.classList.remove('active');
    };

    const showMessage = (title, text) => {
        messageTitle.textContent = title;
        messageText.textContent = text;
        openModal(modals.message);
    };

    // --- AUTH FORM TOGGLE FUNCTIONS ---
    const showSignUp = () => {
        authTitle.textContent = 'Sign Up';
        authButton.textContent = 'Sign Up';
        confirmPasswordGroup.style.display = 'block';
        confirmPasswordField.required = true;
        authToggleLinkContainer.innerHTML = 'Already have an account? <a href="#" id="toggle-to-login">Login</a>';
        document.getElementById('toggle-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    };

    const showLogin = () => {
        authTitle.textContent = 'Login';
        authButton.textContent = 'Login';
        confirmPasswordGroup.style.display = 'none';
        confirmPasswordField.required = false;
        authToggleLinkContainer.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-to-signup">Sign Up</a>';
        document.getElementById('toggle-to-signup').addEventListener('click', (e) => {
            e.preventDefault();
            showSignUp();
        });
    };

    // --- EVENT LISTENERS ---
    modalLinks.about.addEventListener('click', (e) => { e.preventDefault(); openModal(modals.about); });
    modalLinks.mission.addEventListener('click', (e) => { e.preventDefault(); openModal(modals.missionText); });
    modalLinks.contact.addEventListener('click', (e) => { e.preventDefault(); openModal(modals.contact); });
    discoverBtn.addEventListener('click', () => openModal(modals.rolePortal));

    const handleRoleSelection = (role, url) => {
        selectedRoleUrl = url;
        closeModal();
        setTimeout(() => {
            openModal(modals.auth);
            showLogin();
        }, 300);
    };

    userRoleCard.addEventListener('click', () => handleRoleSelection('Community Member', 'user_portal.html'));
    ngoRoleCard.addEventListener('click', () => handleRoleSelection('NGO / Partner', 'ngo_portal.html'));
    expertRoleCard.addEventListener('click', () => handleRoleSelection('Expert / Researcher', 'expert_auth.html'));

    document.getElementById('toggle-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        showSignUp();
    });

    // --- NEW: REAL AUTH FORM SUBMISSION LOGIC ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        let endpoint = '';
        const isSignUp = authTitle.textContent === 'Sign Up';

        if (isSignUp) {
            const confirmPassword = e.target['confirm-password'].value;
            if (password !== confirmPassword) {
                return showMessage("Error", "Passwords do not match!");
            }
            endpoint = 'http://localhost:5000/api/auth/register';
        } else {
            endpoint = 'http://localhost:5000/api/auth/login';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // If the server returns an error (like "User already exists"), show it
                throw new Error(data.msg || 'Something went wrong');
            }

            // On success, the backend sends a token
            if (data.token) {
                // For a prototype, saving the token in localStorage is fine
                localStorage.setItem('token', data.token);
                // Redirect to the correct portal
                window.location.href = selectedRoleUrl;
            }

        } catch (error) {
            showMessage("Authentication Failed", error.message);
        }
    });

    overlay.addEventListener('click', closeModal);
    closeButtons.forEach(button => button.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    messageOkBtn.addEventListener('click', closeModal);
});
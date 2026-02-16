// Portfolio data storage
let projects = JSON.parse(localStorage.getItem('portfolioProjects')) || [];

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links a');
const adminPanel = document.getElementById('adminPanel');
const adminOverlay = document.getElementById('adminOverlay');
const closeAdmin = document.getElementById('closeAdmin');
const addProjectForm = document.getElementById('addProjectForm');
const portfolioGrid = document.getElementById('portfolioGrid');
const adminProjects = document.getElementById('adminProjects');
const projectImageFile = document.getElementById('projectImageFile');
const imagePreview = document.getElementById('imagePreview');
const projectCount = document.getElementById('projectCount');

// Intersection Observer for animations
const cards = document.querySelectorAll('.card');
const heroText = document.querySelector('.hero-text');
const heroImage = document.querySelector('.hero-image');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, { threshold: 0.2 });

cards.forEach(card => observer.observe(card));

if (heroText) observer.observe(heroText);
if (heroImage) observer.observe(heroImage);

// ============================================
// ADMIN AUTHENTICATION SYSTEM
// ============================================
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'WebSolution2025!'
};

let isAdminAuthenticated = sessionStorage.getItem('adminAuth') === 'true';

// DOM Elements for login
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginOverlay = document.getElementById('adminLoginOverlay');
const closeAdminLogin = document.getElementById('closeAdminLogin');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');

// Keyboard shortcut to open login (Ctrl + Shift + A)
let keysPressed = new Set();

document.addEventListener('keydown', (e) => {
  keysPressed.add(e.key.toLowerCase());
  
  const hasCtrl = e.ctrlKey || keysPressed.has('control');
  const hasShift = e.shiftKey || keysPressed.has('shift');
  const hasA = keysPressed.has('a');
  
  if (hasCtrl && hasShift && hasA) {
    e.preventDefault();
    if (isAdminAuthenticated) {
      openAdminPanel();
    } else {
      openAdminLogin();
    }
    keysPressed.clear();
  }
});

document.addEventListener('keyup', (e) => {
  keysPressed.delete(e.key.toLowerCase());
});

// Open admin login modal
function openAdminLogin() {
  if (adminLoginModal) {
    adminLoginModal.classList.add('active');
    document.getElementById('adminUsername').focus();
  }
}

// Close admin login modal
function closeAdminLoginModal() {
  if (adminLoginModal) {
    adminLoginModal.classList.remove('active');
    if (loginError) loginError.classList.remove('active');
    if (adminLoginForm) adminLoginForm.reset();
  }
}

if (closeAdminLogin) {
  closeAdminLogin.addEventListener('click', closeAdminLoginModal);
}

if (adminLoginOverlay) {
  adminLoginOverlay.addEventListener('click', closeAdminLoginModal);
}

// Handle login form submission
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Authentication successful
      isAdminAuthenticated = true;
      sessionStorage.setItem('adminAuth', 'true');
      closeAdminLoginModal();
      openAdminPanel();
      
      // Show success message
      if (loginError) {
        loginError.textContent = 'Login successful! Opening admin panel...';
        loginError.style.background = '#f0fdf4';
        loginError.style.borderColor = '#bbf7d0';
        loginError.style.color = '#16a34a';
        loginError.classList.add('active');
        
        setTimeout(() => {
          loginError.classList.remove('active');
        }, 2000);
      }
    } else {
      // Authentication failed
      if (loginError) {
        loginError.textContent = 'Invalid username or password. Please try again.';
        loginError.classList.add('active');
      }
      
      // Shake animation
      if (adminLoginModal) {
        const content = adminLoginModal.querySelector('.admin-login-content');
        content.style.animation = 'shake 0.5s';
        setTimeout(() => {
          content.style.animation = '';
        }, 500);
      }
    }
  });
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translate(-50%, -50%); }
    10%, 30%, 50%, 70%, 90% { transform: translate(-48%, -50%); }
    20%, 40%, 60%, 80% { transform: translate(-52%, -50%); }
  }
`;
document.head.appendChild(style);

// Open admin panel
function openAdminPanel() {
  if (adminPanel) {
    adminPanel.classList.add('active');
    loadAdminProjects();
    updateProjectCount();
  }
}

// Close admin panel
if (closeAdmin) {
  closeAdmin.addEventListener('click', () => {
    adminPanel.classList.remove('active');
  });
}

if (adminOverlay) {
  adminOverlay.addEventListener('click', () => {
    adminPanel.classList.remove('active');
  });
}

// ============================================
// IMAGE UPLOAD HANDLING
// ============================================
let uploadedImageData = null;

if (projectImageFile) {
  projectImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImageData = event.target.result;
        if (imagePreview) {
          imagePreview.innerHTML = `<img src="${uploadedImageData}" alt="Preview">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

// Add new project
if (addProjectForm) {
  addProjectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const imageUrlInput = document.getElementById('projectImage').value;
    const finalImageUrl = uploadedImageData || imageUrlInput;
    
    if (!finalImageUrl) {
      alert('Please provide either an image file or an image URL');
      return;
    }
    
    const project = {
      id: Date.now(),
      title: document.getElementById('projectTitle').value,
      category: document.getElementById('projectCategory').value,
      description: document.getElementById('projectDescription').value,
      image: finalImageUrl,
      link: document.getElementById('projectLink').value
    };
    
    projects.push(project);
    saveProjects();
    displayProjects();
    loadAdminProjects();
    updateProjectCount();
    
    // Reset form and image preview
    addProjectForm.reset();
    if (imagePreview) imagePreview.innerHTML = '';
    uploadedImageData = null;
    
    // Show success message
    alert('Project added successfully!');
  });
}

// Save projects to localStorage
function saveProjects() {
  localStorage.setItem('portfolioProjects', JSON.stringify(projects));
}

// Update project count
function updateProjectCount() {
  if (projectCount) {
    const count = projects.length;
    projectCount.textContent = `${count} Project${count !== 1 ? 's' : ''}`;
  }
}

// Display projects on portfolio page
function displayProjects() {
  if (!portfolioGrid) return;
  
  if (projects.length === 0) {
    portfolioGrid.innerHTML = '<div class="portfolio-empty">No projects available yet. Check back soon!</div>';
    return;
  }
  
  portfolioGrid.innerHTML = projects.map(project => `
    <div class="portfolio-item">
      <div class="portfolio-item-image">
        <img src="${project.image}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/400x280/e0f2fe/3b82f6?text=${encodeURIComponent(project.title)}'">
      </div>
      <div class="portfolio-item-content">
        <span class="portfolio-item-category">${project.category}</span>
        <h3 class="portfolio-item-title">${project.title}</h3>
        <p class="portfolio-item-description">${project.description}</p>
        ${project.link ? `
          <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="portfolio-item-link">
            Visit Website
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Load projects in admin panel
function loadAdminProjects() {
  if (!adminProjects) return;
  
  if (projects.length === 0) {
    adminProjects.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px 20px; font-size: 1.05rem;">No projects yet. Create your first project above!</p>';
    return;
  }
  
  adminProjects.innerHTML = projects.map(project => `
    <div class="admin-project-item">
      <div class="admin-project-thumbnail">
        <img src="${project.image}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/100x100/e0f2fe/3b82f6?text=No+Image'">
      </div>
      <div class="admin-project-info">
        <h4>${project.title}</h4>
        <p><strong>Category:</strong> ${project.category}</p>
        <p><strong>Description:</strong> ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
        ${project.link ? `<p><strong>Link:</strong> <a href="${project.link}" target="_blank" style="color: #3b82f6;">${project.link.substring(0, 40)}${project.link.length > 40 ? '...' : ''}</a></p>` : ''}
      </div>
      <div class="admin-project-actions">
        <button class="admin-delete-btn" onclick="deleteProject(${project.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Delete project
function deleteProject(id) {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    projects = projects.filter(project => project.id !== id);
    saveProjects();
    displayProjects();
    loadAdminProjects();
    updateProjectCount();
  }
}

// Initialize portfolio display on page load
document.addEventListener('DOMContentLoaded', () => {
  displayProjects();
  updateProjectCount();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============================================
// DARK MODE FUNCTIONALITY
// ============================================
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// ============================================
// PAGE LOADER
// ============================================
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 800);
  }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================
const observeElements = document.querySelectorAll('.card, .testimonial-card, .portfolio-item, .pricing-card, .addon-card');

if (observeElements.length > 0) {
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  observeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
  });
}

// ============================================
// FAQ ACCORDION
// ============================================
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const faqItem = question.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Open clicked FAQ if it wasn't active
    if (!isActive) {
      faqItem.classList.add('active');
    }
  });
});

// ============================================
// IMPROVED MOBILE MENU
// ============================================
if (hamburger && navLinks) {
  const body = document.body;
  
  // Hamburger click handler
  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isOpen = navLinks.classList.contains('open');
    
    if (isOpen) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      body.style.overflow = 'auto';
    } else {
      navLinks.classList.add('open');
      hamburger.classList.add('open');
      body.style.overflow = 'hidden';
    }
    
    hamburger.setAttribute('aria-expanded', !isOpen);
  });
  
  // Close menu when clicking links
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Allow navigation to work
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      body.style.overflow = 'auto';
    });
  });
  
  // Close menu when clicking on the overlay/background
  navLinks.addEventListener('click', (e) => {
    if (e.target === navLinks) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      body.style.overflow = 'auto';
    }
  });
}

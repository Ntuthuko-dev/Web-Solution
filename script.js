// =============================================================
//  WEB SOLUTION — MAIN SCRIPT
//  Cloud-powered portfolio: JSONBin.io (DB) + Cloudinary (images)
// =============================================================

// ─────────────────────────────────────────────
//  ⚙️  CONFIGURATION  ← YOU MUST FILL THESE IN
// ─────────────────────────────────────────────
const CONFIG = {
  // ── JSONBin.io (free cloud database) ──────────────────────
  // 1. Go to https://jsonbin.io and create a FREE account
  // 2. Click "Bins" → "Create Bin"
  // 3. Paste this as the initial value:  { "projects": [] }
  // 4. Copy the Bin ID from the URL  (looks like: 66a3f2e......)
  // 5. Go to API Keys → create a key and copy it
  JSONBIN_BIN_ID:  'PASTE_YOUR_BIN_ID_HERE',
  JSONBIN_API_KEY: 'PASTE_YOUR_API_KEY_HERE',

  // ── Cloudinary (free image hosting) ───────────────────────
  // 1. Go to https://cloudinary.com and create a FREE account
  // 2. From the Dashboard copy your "Cloud Name"
  // 3. Go to Settings → Upload → Add Upload Preset
  //    • Signing Mode = Unsigned
  //    • Copy the preset name
  CLOUDINARY_CLOUD_NAME:   'PASTE_YOUR_CLOUD_NAME_HERE',
  CLOUDINARY_UPLOAD_PRESET:'PASTE_YOUR_UPLOAD_PRESET_HERE',
};
// ─────────────────────────────────────────────

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'WebSolution2025!'
};

// ── Runtime state ──────────────────────────────────────────
let projects = [];
let isAdminAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
let uploadedImageUrl = null;   // final cloud URL after Cloudinary upload

// ── DOM references ─────────────────────────────────────────
const hamburger        = document.querySelector('.hamburger');
const navLinks         = document.querySelector('.nav-links');
const links            = document.querySelectorAll('.nav-links a');
const adminPanel       = document.getElementById('adminPanel');
const adminOverlay     = document.getElementById('adminOverlay');
const closeAdmin       = document.getElementById('closeAdmin');
const addProjectForm   = document.getElementById('addProjectForm');
const portfolioGrid    = document.getElementById('portfolioGrid');
const adminProjectsEl  = document.getElementById('adminProjects');
const projectImageFile = document.getElementById('projectImageFile');
const imagePreview     = document.getElementById('imagePreview');
const projectCount     = document.getElementById('projectCount');
const adminLoginModal  = document.getElementById('adminLoginModal');
const adminLoginOverlay= document.getElementById('adminLoginOverlay');
const closeAdminLogin  = document.getElementById('closeAdminLogin');
const adminLoginForm   = document.getElementById('adminLoginForm');
const loginError       = document.getElementById('loginError');
const themeToggle      = document.getElementById('themeToggle');


// =============================================================
//  CLOUD DATABASE (JSONBin.io)
// =============================================================

function jsonbinHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': CONFIG.JSONBIN_API_KEY,
    'X-Bin-Versioning': 'false'
  };
}

/** Load ALL projects from JSONBin */
async function loadProjectsFromCloud() {
  // Guard: if not configured yet use localStorage fallback
  if (CONFIG.JSONBIN_BIN_ID === 'PASTE_YOUR_BIN_ID_HERE') {
    projects = JSON.parse(localStorage.getItem('portfolioProjects') || '[]');
    displayProjects();
    updateProjectCount();
    return;
  }

  try {
    setGridLoading(true);
    const res = await fetch(
      `https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`,
      { headers: jsonbinHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    projects = data.record.projects || [];
    displayProjects();
    updateProjectCount();
  } catch (err) {
    console.error('Failed to load projects from cloud:', err);
    showGridError('Failed to load projects. Check your internet connection.');
  } finally {
    setGridLoading(false);
  }
}

/** Save all projects back to JSONBin */
async function saveProjectsToCloud() {
  if (CONFIG.JSONBIN_BIN_ID === 'PASTE_YOUR_BIN_ID_HERE') {
    // Fallback to localStorage when not yet configured
    localStorage.setItem('portfolioProjects', JSON.stringify(projects));
    return true;
  }

  const res = await fetch(
    `https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`,
    {
      method: 'PUT',
      headers: jsonbinHeaders(),
      body: JSON.stringify({ projects })
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}


// =============================================================
//  IMAGE UPLOAD (Cloudinary)
// =============================================================

/** Upload a File object to Cloudinary; returns the secure URL */
async function uploadImageToCloudinary(file) {
  if (
    CONFIG.CLOUDINARY_CLOUD_NAME   === 'PASTE_YOUR_CLOUD_NAME_HERE' ||
    CONFIG.CLOUDINARY_UPLOAD_PRESET === 'PASTE_YOUR_UPLOAD_PRESET_HERE'
  ) {
    // Not configured — convert to base64 as local fallback (won't work online)
    return await fileToBase64(file);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary HTTP ${res.status}`);
  const data = await res.json();
  return data.secure_url;   // permanent public URL
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}


// =============================================================
//  PORTFOLIO DISPLAY
// =============================================================

function setGridLoading(on) {
  if (!portfolioGrid) return;
  if (on) {
    portfolioGrid.innerHTML = `
      <div class="portfolio-loading">
        <div class="portfolio-spinner"></div>
        <p>Loading projects…</p>
      </div>`;
  }
}

function showGridError(msg) {
  if (!portfolioGrid) return;
  portfolioGrid.innerHTML = `<div class="portfolio-empty">${msg}</div>`;
}

function displayProjects() {
  if (!portfolioGrid) return;

  if (projects.length === 0) {
    portfolioGrid.innerHTML = '<div class="portfolio-empty">No projects available yet. Check back soon!</div>';
    return;
  }

  portfolioGrid.innerHTML = projects.map(project => `
    <div class="portfolio-item">
      <div class="portfolio-item-image">
        <img
          src="${project.image}"
          alt="${escHtml(project.title)}"
          loading="lazy"
          onerror="this.src='https://placehold.co/400x280/e0f2fe/3b82f6?text=${encodeURIComponent(project.title)}'">
      </div>
      <div class="portfolio-item-content">
        <span class="portfolio-item-category">${escHtml(project.category)}</span>
        <h3 class="portfolio-item-title">${escHtml(project.title)}</h3>
        <p class="portfolio-item-description">${escHtml(project.description)}</p>
        ${project.link ? `
          <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="portfolio-item-link">
            Visit Website
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>` : ''}
      </div>
    </div>
  `).join('');
}


// =============================================================
//  ADMIN PANEL — PROJECTS LIST
// =============================================================

function loadAdminProjects() {
  if (!adminProjectsEl) return;

  if (projects.length === 0) {
    adminProjectsEl.innerHTML =
      '<p style="color:#94a3b8;text-align:center;padding:40px 20px;">No projects yet. Add your first project above!</p>';
    return;
  }

  adminProjectsEl.innerHTML = projects.map(project => `
    <div class="admin-project-item">
      <div class="admin-project-thumbnail">
        <img src="${project.image}" alt="${escHtml(project.title)}"
          onerror="this.src='https://placehold.co/100x100/e0f2fe/3b82f6?text=Img'">
      </div>
      <div class="admin-project-info">
        <h4>${escHtml(project.title)}</h4>
        <p><strong>Category:</strong> ${escHtml(project.category)}</p>
        <p><strong>Description:</strong> ${escHtml(project.description.substring(0, 100))}${project.description.length > 100 ? '…' : ''}</p>
        ${project.link ? `<p><strong>Link:</strong> <a href="${project.link}" target="_blank" style="color:#3b82f6">${project.link.substring(0, 40)}…</a></p>` : ''}
      </div>
      <div class="admin-project-actions">
        <button class="admin-delete-btn" onclick="deleteProject('${project.id}')">
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

function updateProjectCount() {
  if (projectCount) {
    const c = projects.length;
    projectCount.textContent = `${c} Project${c !== 1 ? 's' : ''}`;
  }
}


// =============================================================
//  ADD PROJECT
// =============================================================

// ── File picker → upload preview ───────────────────────────
if (projectImageFile) {
  projectImageFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately while uploading
    try {
      const localUrl = await fileToBase64(file);
      if (imagePreview) {
        imagePreview.innerHTML = `
          <div class="upload-progress-wrap">
            <img src="${localUrl}" alt="Preview" style="max-width:100%;border-radius:8px;">
            <p class="upload-status" id="uploadStatus">⏳ Uploading to cloud…</p>
          </div>`;
      }

      // Upload to Cloudinary
      uploadedImageUrl = await uploadImageToCloudinary(file);

      const statusEl = document.getElementById('uploadStatus');
      if (statusEl) {
        statusEl.textContent = '✅ Image uploaded successfully!';
        statusEl.style.color = '#16a34a';
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      uploadedImageUrl = null;
      if (imagePreview) {
        imagePreview.innerHTML = '<p style="color:#ef4444;">❌ Upload failed. Please try a URL instead.</p>';
      }
    }
  });
}

// ── Form submit ─────────────────────────────────────────────
if (addProjectForm) {
  addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const urlInput = document.getElementById('projectImage')?.value?.trim();
    const finalImage = uploadedImageUrl || urlInput;

    if (!finalImage) {
      showAdminToast('⚠️ Please upload an image or enter an image URL.', 'error');
      return;
    }

    const submitBtn = addProjectForm.querySelector('.btn-submit');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="opacity:.6">Saving…</span>`;
    }

    const project = {
      id:          Date.now().toString(),
      title:       document.getElementById('projectTitle').value.trim(),
      category:    document.getElementById('projectCategory').value.trim(),
      description: document.getElementById('projectDescription').value.trim(),
      image:       finalImage,
      link:        document.getElementById('projectLink')?.value?.trim() || ''
    };

    try {
      projects.push(project);
      await saveProjectsToCloud();

      // Reset UI
      addProjectForm.reset();
      if (imagePreview) imagePreview.innerHTML = '';
      uploadedImageUrl = null;

      displayProjects();
      loadAdminProjects();
      updateProjectCount();

      showAdminToast('✅ Project added and visible to all visitors!', 'success');
    } catch (err) {
      console.error('Failed to save project:', err);
      projects.pop(); // roll back
      showAdminToast('❌ Failed to save. Check your JSONBin config.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
}


// =============================================================
//  DELETE PROJECT
// =============================================================

async function deleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;

  const backup = [...projects];
  projects = projects.filter(p => p.id !== String(id));

  try {
    await saveProjectsToCloud();
    displayProjects();
    loadAdminProjects();
    updateProjectCount();
    showAdminToast('🗑️ Project deleted.', 'success');
  } catch (err) {
    console.error('Delete failed:', err);
    projects = backup; // restore
    showAdminToast('❌ Delete failed. Check your connection.', 'error');
  }
}


// =============================================================
//  ADMIN TOAST NOTIFICATION
// =============================================================

function showAdminToast(message, type = 'success') {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `admin-toast admin-toast--${type} admin-toast--show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('admin-toast--show'), 3500);
}


// =============================================================
//  ADMIN AUTHENTICATION
// =============================================================

function openAdminLogin() {
  if (adminLoginModal) {
    adminLoginModal.classList.add('active');
    setTimeout(() => document.getElementById('adminUsername')?.focus(), 100);
  }
}

function closeAdminLoginModal() {
  if (adminLoginModal) {
    adminLoginModal.classList.remove('active');
    if (loginError) loginError.classList.remove('active');
    if (adminLoginForm) adminLoginForm.reset();
  }
}

if (closeAdminLogin)  closeAdminLogin.addEventListener('click', closeAdminLoginModal);
if (adminLoginOverlay) adminLoginOverlay.addEventListener('click', closeAdminLoginModal);

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUsername')?.value;
    const password = document.getElementById('adminPassword')?.value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      isAdminAuthenticated = true;
      sessionStorage.setItem('adminAuth', 'true');
      closeAdminLoginModal();
      openAdminPanel();
    } else {
      if (loginError) {
        loginError.textContent = 'Invalid username or password.';
        loginError.classList.add('active');
      }
      const content = adminLoginModal?.querySelector('.admin-login-content');
      if (content) {
        content.style.animation = 'none';
        requestAnimationFrame(() => { content.style.animation = 'shake 0.5s'; });
      }
    }
  });
}

// Shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translate(-50%,-50%)}
    20%,60%{transform:translate(-48%,-50%)}
    40%,80%{transform:translate(-52%,-50%)}
  }`;
document.head.appendChild(shakeStyle);


// =============================================================
//  OPEN / CLOSE ADMIN PANEL
// =============================================================

function openAdminPanel() {
  if (adminPanel) {
    adminPanel.classList.add('active');
    loadAdminProjects();
    updateProjectCount();
  }
}

if (closeAdmin)   closeAdmin.addEventListener('click',   () => adminPanel?.classList.remove('active'));
if (adminOverlay) adminOverlay.addEventListener('click', () => adminPanel?.classList.remove('active'));


// =============================================================
//  KEYBOARD SHORTCUT  Ctrl + Shift + A
// =============================================================
const keysPressed = new Set();

document.addEventListener('keydown', (e) => {
  keysPressed.add(e.key.toLowerCase());
  if (e.ctrlKey && e.shiftKey && keysPressed.has('a')) {
    e.preventDefault();
    isAdminAuthenticated ? openAdminPanel() : openAdminLogin();
    keysPressed.clear();
  }
});
document.addEventListener('keyup', (e) => keysPressed.delete(e.key.toLowerCase()));


// =============================================================
//  DARK MODE
// =============================================================
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}


// =============================================================
//  PAGE LOADER
// =============================================================
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (loader) setTimeout(() => loader.classList.add('hidden'), 800);
});


// =============================================================
//  SCROLL ANIMATIONS
// =============================================================
const animateTargets = document.querySelectorAll(
  '.card, .testimonial-card, .portfolio-item, .pricing-card, .addon-card'
);

if (animateTargets.length > 0) {
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 100);
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  animateTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
  });
}


// =============================================================
//  FAQ ACCORDION
// =============================================================
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const wasOpen = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!wasOpen) item.classList.add('active');
  });
});


// =============================================================
//  MOBILE MENU
// =============================================================
if (hamburger && navLinks) {
  const body = document.body;

  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = navLinks.classList.contains('open');
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
    body.style.overflow = isOpen ? '' : 'hidden';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      body.style.overflow = '';
    });
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target === navLinks) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      body.style.overflow = '';
    }
  });
}


// =============================================================
//  INTERSECTION OBSERVER — GENERIC SHOW
// =============================================================
const showObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: 0.2 });

document.querySelectorAll('.hero-text, .hero-image').forEach(el => showObserver.observe(el));


// =============================================================
//  SMOOTH SCROLL
// =============================================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// =============================================================
//  INIT — load projects from cloud when page is ready
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadProjectsFromCloud();
});


// =============================================================
//  UTILITY
// =============================================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

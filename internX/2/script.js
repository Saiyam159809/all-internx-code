// ==========================================
// 1. SUPABASE CONFIGURATION
// Replace the credentials below with your actual project details
// ==========================================
const SUPABASE_URL = "https://adheihrfvnguqvnmcrcw.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaGVpaHJmdm5ndXF2bm1jcmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTY3MjAsImV4cCI6MjEwMjA5MjcyMH0.lZlsruf6a_h_PimVMwXMayi2Vvl20Uing8yDQUUPbQE";

let supabaseClient = null;

// Initialize client if credentials are configured
if (SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE" && typeof supabase !== 'undefined') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Global Auth State variables
let currentAuthMode = "signin"; // "signin" or "register"
let selectedRole = "student";   // "student" or "company"

// ==========================================
// 2. DARK / LIGHT THEME TOGGLE LOGIC
// ==========================================
const themeToggleBtn = document.getElementById("theme-toggle");

// Initialize theme from LocalStorage or default to light
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

// ==========================================
// 3. AUTH MODAL & TAB CONTROLS
// ==========================================
function openAuthModal(mode = "signin", role = "student") {
  currentAuthMode = mode;
  selectedRole = role;

  const modal = document.getElementById("auth-modal");
  modal.classList.add("active");

  switchAuthTab(mode);
  selectRole(role);
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("active");
}

function switchAuthTab(tab) {
  currentAuthMode = tab;
  
  const title = document.getElementById("modal-title");
  const subtitle = document.getElementById("modal-subtitle");
  const tabSignin = document.getElementById("tab-signin");
  const tabRegister = document.getElementById("tab-register");
  const roleSelector = document.getElementById("role-selector");
  const nameGroup = document.getElementById("name-field-group");
  const submitBtn = document.getElementById("auth-submit-btn");
  const pwdHint = document.getElementById("password-hint");

  if (tab === "register") {
    title.textContent = "Create your account";
    subtitle.textContent = "Choose how you want to use InternX. You can complete your profile right after.";
    tabSignin.classList.remove("active");
    tabRegister.classList.add("active");
    roleSelector.classList.remove("hidden");
    nameGroup.classList.remove("hidden");
    pwdHint.classList.remove("hidden");
    submitBtn.textContent = "Create account";
  } else {
    title.textContent = "Welcome back";
    subtitle.textContent = "Sign in to continue to your InternX dashboard.";
    tabSignin.classList.add("active");
    tabRegister.classList.remove("active");
    roleSelector.classList.add("hidden");
    nameGroup.classList.add("hidden");
    pwdHint.classList.add("hidden");
    submitBtn.textContent = "Sign in";
  }
}

function selectRole(role) {
  selectedRole = role;
  const btnStudent = document.getElementById("role-student");
  const btnCompany = document.getElementById("role-company");

  if (role === "student") {
    btnStudent.classList.add("active");
    btnCompany.classList.remove("active");
  } else {
    btnCompany.classList.add("active");
    btnStudent.classList.remove("active");
  }
}

// ==========================================
// 4. SUPABASE AUTHENTICATION HANDLERS
// ==========================================
async function handleAuthSubmit(e) {
  e.preventDefault();

  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const fullName = document.getElementById("auth-name").value;

  if (!supabaseClient) {
    alert("Supabase Client is not configured. Please paste your SUPABASE_URL and SUPABASE_ANON_KEY inside app.js.");
    return;
  }

  if (currentAuthMode === "register") {
    // Supabase Sign Up Flow
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          user_role: selectedRole
        }
      }
    });

    if (error) {
      alert("Registration Error: " + error.message);
    } else {
      alert("Account created successfully! Check your email for verification.");
      closeAuthModal();
    }
  } else {
    // Supabase Sign In Flow
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert("Sign In Error: " + error.message);
    } else {
      alert("Welcome back, " + data.user.email);
      closeAuthModal();
    }
  }
}

// OAuth Google Login Function
async function handleGoogleSignIn() {
  if (!supabaseClient) {
    alert("Supabase Client is not configured. Please paste your credentials inside app.js.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google'
  });

  if (error) {
    alert("Google Sign In Error: " + error.message);
  }
}

// Optional backdrop click to close modal
document.getElementById("auth-modal").addEventListener("click", function(e) {
  if (e.target === this) {
    closeAuthModal();
  }
});

// ==========================================
// 5. GLOBAL FUNCTION EXPORTS (FIXES NOT DEFINED ERRORS)
// ==========================================
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.selectRole = selectRole;
window.handleAuthSubmit = handleAuthSubmit;
window.handleGoogleSignIn = handleGoogleSignIn;
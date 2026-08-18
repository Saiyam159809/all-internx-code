// ================= 0. CONFIGURATION =================
const SUPABASE_URL = "https://adheihrfvnguqvnmcrcw.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaGVpaHJmdm5ndXF2bm1jcmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MTY3MjAsImV4cCI6MjEwMjA5MjcyMH0.lZlsruf6a_h_PimVMwXMayi2Vvl20Uing8yDQUUPbQE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) { alert(message); return; }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

// Global Step Navigation for Onboarding
function goToStep(stepNumber) {
    document.querySelectorAll(".form-step").forEach(el => el.classList.remove("active-step"));
    document.getElementById(`step-${stepNumber}`).classList.add("active-step");
    
    const progressMap = { 1: "33%", 2: "66%", 3: "100%" };
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = progressMap[stepNumber];
}

// ================= 1. REGISTER LOGIC =================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        showToast("Creating account...");
        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            alert("Registration Error: " + error.message);
        } else if (data.user) {
            alert("Account created successfully! Please sign in.");
            window.location.href = "index.html";
        }
    });
}

// ================= 2. LOGIN & SMART ROUTING LOGIC =================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        showToast("Logging in...");
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            alert("Login Failed: " + error.message);
        } else if (data.user) {
            // Check if profile exists
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!profile) {
                window.location.href = "onboarding.html";
            } else {
                window.location.href = "profile.html";
            }
        }
    });
}

// ================= 3. ONBOARDING SETUP LOGIC =================
let selectedGender = "";
let selectedUserType = "College student";
let selectedCourse = "";
let selectedInterests = [];

document.addEventListener("DOMContentLoaded", async () => {
    const onboardingForm = document.getElementById("onboardingForm");
    if (onboardingForm) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { window.location.href = "index.html"; return; }

        document.getElementById("userEmail").value = session.user.email;

        // Pill clicks
        document.querySelectorAll(".pill-group").forEach(group => {
            group.addEventListener("click", (e) => {
                const btn = e.target.closest(".pill-btn");
                if (!btn) return;

                const isMulti = group.classList.contains("multi-select");
                const val = btn.getAttribute("data-value");

                if (isMulti) {
                    btn.classList.toggle("active");
                    if (btn.classList.contains("active")) {
                        selectedInterests.push(val);
                    } else {
                        selectedInterests = selectedInterests.filter(i => i !== val);
                    }
                } else {
                    group.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    if (group.id === "genderPills") selectedGender = val;
                    if (group.id === "userTypePills") selectedUserType = val;
                    if (group.id === "coursePills") selectedCourse = val;
                }
            });
        });

        onboardingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const firstName = document.getElementById("firstName").value.trim();
            const lastName = document.getElementById("lastName").value.trim();
            const fullName = `${firstName} ${lastName}`.trim();

            const profileData = {
                id: session.user.id,
                email: session.user.email,
                full_name: fullName,
                phone: document.getElementById("phone").value.trim(),
                address: document.getElementById("city").value.trim(),
                gender: selectedGender,
                user_type: selectedUserType,
                department: selectedCourse || "Computer Science",
                college_name: document.getElementById("collegeName").value.trim(),
                stream: document.getElementById("stream").value.trim(),
                start_year: document.getElementById("startYear").value,
                end_year: document.getElementById("endYear").value,
                interests: selectedInterests.join(", ")
            };

            const { error } = await supabaseClient.from('profiles').upsert(profileData);

            if (error) {
                alert("Failed to save profile: " + error.message);
            } else {
                alert("Profile completed! Redirecting...");
                window.location.href = "profile.html";
            }
        });
    }

    // ================= 4. PROFILE DASHBOARD LOGIC =================
    const profileGrid = document.querySelector(".profile-grid");
    if (profileGrid) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { window.location.href = "index.html"; return; }

        const userId = session.user.id;

        // Fetch user data
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (!profile) {
            window.location.href = "onboarding.html";
            return;
        }

        document.getElementById("profile-sidebar-name").innerText = profile.full_name || "Student User";
        document.getElementById("profile-name").innerText = profile.full_name || "Student User";
        document.getElementById("profile-email").innerText = profile.email || session.user.email;
        document.getElementById("profile-dept").innerText = `${profile.department || ''} - ${profile.stream || ''}`;
        document.getElementById("profile-college").innerText = profile.college_name || "N/A";
        document.getElementById("profile-phone").innerText = profile.phone || "N/A";
        document.getElementById("profile-city").innerText = profile.address || "N/A";
        document.getElementById("profile-gender").innerText = profile.gender || "N/A";
        document.getElementById("profile-years").innerText = `${profile.start_year || ''} - ${profile.end_year || ''}`;
        document.getElementById("profile-interests").innerText = profile.interests || "N/A";

        // Master Edit Button
        const editBtn = document.getElementById("editProfileBtn");
        const editables = document.querySelectorAll(".editable-field");

        if (editBtn) {
            editBtn.addEventListener("click", async () => {
                const isEditing = editBtn.classList.contains("editing");

                if (isEditing) {
                    const updatedData = {
                        id: userId,
                        college_name: document.getElementById("profile-college").innerText,
                        phone: document.getElementById("profile-phone").innerText,
                        address: document.getElementById("profile-city").innerText,
                        gender: document.getElementById("profile-gender").innerText,
                        interests: document.getElementById("profile-interests").innerText
                    };

                    const { error } = await supabaseClient.from('profiles').upsert(updatedData);

                    editables.forEach(el => {
                        el.contentEditable = "false";
                        el.style.border = "none";
                        el.style.backgroundColor = "";
                    });

                    if (error) {
                        alert("Update failed: " + error.message);
                    } else {
                        alert("Profile updated successfully!");
                    }

                    editBtn.innerText = "Edit Profile";
                    editBtn.classList.remove("editing");
                } else {
                    editables.forEach(el => {
                        el.contentEditable = "true";
                        el.style.border = "1px dashed #3b82f6";
                        el.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        el.style.padding = "4px";
                        el.style.borderRadius = "4px";
                    });

                    editBtn.innerText = "Save Profile";
                    editBtn.classList.add("editing");
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await supabaseClient.auth.signOut();
                window.location.href = "index.html";
            });
        }
    }
});
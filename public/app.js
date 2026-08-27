// ============================================================
// GroupBy: Campus Team Formation Platform
// Client-Side Script with New Dashboard Landing & Seamless Navigation
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let state = {
    students: [],
    activeStudent: null,
    courses: [],
    skillsTaxonomy: [],
    teams: [],
    requests: { outgoing: [], incoming: [] },
    currentView: 'dashboard', // 'dashboard', 'search-teams', 'search-students', 'my-profile', 'requests'
    selectedSlotForCandidateSearch: null
  };

  // DOM Elements
  const activeStudentSelect = document.getElementById('activeStudentSelect');
  const userGreeting = document.getElementById('userGreeting');
  const userAvatarCircle = document.getElementById('userAvatarCircle');
  const userAvatarName = document.getElementById('userAvatarName');
  const btnUserPill = document.getElementById('btnUserPill');

  // Sidebar Buttons & Badges
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const navRequestsBadge = document.getElementById('navRequestsBadge');
  const headerBellBadge = document.getElementById('headerBellBadge');
  const btnHeaderBell = document.getElementById('btnHeaderBell');
  const btnLogout = document.getElementById('btnLogout');

  // Dashboard & Feed Views
  const dashboardView = document.getElementById('dashboardView');
  const feedView = document.getElementById('feedView');
  const dashWidgetsContainer = document.getElementById('dashWidgetsContainer');
  const feedWidgetsContainer = document.getElementById('feedWidgetsContainer');

  // Dashboard Hero Choice Cards
  const dashBtnJoin = document.getElementById('dashBtnJoin');
  const dashBtnFill = document.getElementById('dashBtnFill');
  const dashMetricPending = document.getElementById('dashMetricPending');
  const btnDashEditProfile = document.getElementById('btnDashEditProfile');

  // Filters
  const filterBarContainer = document.getElementById('filterBarContainer');
  const branchFilterSelect = document.getElementById('branchFilterSelect');
  const semesterFilterSelect = document.getElementById('semesterFilterSelect');
  const courseFilterSelect = document.getElementById('courseFilterSelect');
  const skillKeywordInput = document.getElementById('skillKeywordInput');
  const btnSearchSubmit = document.getElementById('btnSearchSubmit');
  const btnSearchReset = document.getElementById('btnSearchReset');

  // Feed & Widgets
  const feedTitleText = document.getElementById('feedTitleText');
  const feedOpenSlotsBadge = document.getElementById('feedOpenSlotsBadge');
  const teamsFeedList = document.getElementById('teamsFeedList');

  const widgetSkillPills = document.getElementById('widgetSkillPills');
  const widgetYourTeams = document.getElementById('widgetYourTeams');
  const widgetRequestsSummary = document.getElementById('widgetRequestsSummary');
  const widgetSkillGapContent = document.getElementById('widgetSkillGapContent');
  const widgetPastCollabs = document.getElementById('widgetPastCollabs');
  const btnWidgetViewRequests = document.getElementById('btnWidgetViewRequests');
  const btnEditSkills = document.getElementById('btnEditSkills');

  // Modals - AUTH
  const authModal = document.getElementById('authModal');
  const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const tabAuthLogin = document.getElementById('tabAuthLogin');
  const tabAuthRegister = document.getElementById('tabAuthRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');

  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regRollNo = document.getElementById('regRollNo');
  const regBranch = document.getElementById('regBranch');
  const regSemester = document.getElementById('regSemester');
  const regPassword = document.getElementById('regPassword');
  const regMobile = document.getElementById('regMobile');
  const regInstagram = document.getElementById('regInstagram');
  const regLinkedin = document.getElementById('regLinkedin');
  const regGithub = document.getElementById('regGithub');
  const regLeetcode = document.getElementById('regLeetcode');

  // Modals - EDIT PROFILE & SKILLS
  const editProfileModal = document.getElementById('editProfileModal');
  const btnCloseEditProfileModal = document.getElementById('btnCloseEditProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');
  const editName = document.getElementById('editName');
  const editBranch = document.getElementById('editBranch');
  const editSemester = document.getElementById('editSemester');
  const editMobile = document.getElementById('editMobile');
  const editInstagram = document.getElementById('editInstagram');
  const editLinkedin = document.getElementById('editLinkedin');
  const editGithub = document.getElementById('editGithub');
  const editLeetcode = document.getElementById('editLeetcode');

  const addSkillModal = document.getElementById('addSkillModal');
  const btnCloseAddSkillModal = document.getElementById('btnCloseAddSkillModal');
  const addSkillForm = document.getElementById('addSkillForm');
  const addSkillSelect = document.getElementById('addSkillSelect');
  const addSkillProficiency = document.getElementById('addSkillProficiency');
  const addSkillCredential = document.getElementById('addSkillCredential');

  // Modals - CREATE TEAM & REQUESTS
  const createTeamModal = document.getElementById('createTeamModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const createTeamForm = document.getElementById('createTeamForm');
  const newTeamName = document.getElementById('newTeamName');
  const newTeamCourse = document.getElementById('newTeamCourse');
  const newTeamCreator = document.getElementById('newTeamCreator');

  const sendRequestModal = document.getElementById('sendRequestModal');
  const btnCloseRequestModal = document.getElementById('btnCloseRequestModal');
  const sendRequestForm = document.getElementById('sendRequestForm');
  const requestModalSlotId = document.getElementById('requestModalSlotId');
  const requestModalStudentId = document.getElementById('requestModalStudentId');
  const requestModalMessage = document.getElementById('requestModalMessage');
  const requestModalSlotDetails = document.getElementById('requestModalSlotDetails');

  const contactInfoModal = document.getElementById('contactInfoModal');
  const btnCloseContactModal = document.getElementById('btnCloseContactModal');
  const contactModalContent = document.getElementById('contactModalContent');

  const toast = document.getElementById('toast');

  // Google OAuth Elements
  const googleAuthError = document.getElementById('googleAuthError');
  const googleAuthErrorText = document.getElementById('googleAuthErrorText');
  const btnGoogleAuth = document.getElementById('btnGoogleAuth');
  const googleSignInBtnContainer = document.getElementById('googleSignInBtnContainer');

  // Initialize App
  init();

  async function init() {
    setupEventListeners();
    renderAddSkillDropdown();
    populateSkillFilterDropdown();
    await fetchMetadata();
    await checkSavedSession();
    await initGoogleOAuth();
  }

  // ------------------------------------------------------------
  // METADATA & ACTIVE USER LOGIC
  // ------------------------------------------------------------
  async function fetchMetadata() {
    try {
      const reqParam = state.activeStudent ? `?requester_id=${state.activeStudent.student_id}` : '';
      const resStudents = await fetch(`/api/students${reqParam}`);
      const dataStudents = await resStudents.json();
      if (dataStudents.success) {
        state.students = dataStudents.data;
        renderStudentSelector();
      }

      const resCourses = await fetch('/api/courses');
      const dataCourses = await resCourses.json();
      if (dataCourses.success) {
        state.courses = dataCourses.data;
        renderCourseDropdowns();
      }

      const resSkills = await fetch('/api/skills');
      const dataSkills = await resSkills.json();
      if (dataSkills.success && dataSkills.data && dataSkills.data.skills && dataSkills.data.skills.length > 0) {
        state.skillsTaxonomy = dataSkills.data.skills;
      } else if (!state.skillsTaxonomy || state.skillsTaxonomy.length === 0) {
        state.skillsTaxonomy = PREDEFINED_SKILLS_TAXONOMY_STATIC;
      }
      renderAddSkillDropdown();
      populateSkillFilterDropdown();

      const resTeams = await fetch('/api/teams');
      const dataTeams = await resTeams.json();
      if (dataTeams.success) {
        state.teams = dataTeams.data;
      }
    } catch (err) {
      showToast('Error loading metadata: ' + err.message, 'error');
    }
  }

  function renderStudentSelector() {
    activeStudentSelect.innerHTML = '';
    state.students.forEach((st) => {
      const opt = document.createElement('option');
      opt.value = st.student_id;
      opt.textContent = `${st.name} (${st.branch} Sem ${st.semester})`;
      activeStudentSelect.appendChild(opt);
    });
  }

  const landingPage = document.getElementById('landingPage');
  const appWrapper = document.querySelector('.app-wrapper');
  const btnLandingNavLogin = document.getElementById('btnLandingNavLogin');
  const btnLandingNavSignup = document.getElementById('btnLandingNavSignup');
  const btnLandingHeroSignIn = document.getElementById('btnLandingHeroSignIn');

  function showLandingPage() {
    if (landingPage) landingPage.classList.remove('hidden');
    if (appWrapper) appWrapper.classList.add('hidden');
  }

  function showMainApp() {
    if (landingPage) landingPage.classList.add('hidden');
    if (appWrapper) appWrapper.classList.remove('hidden');
  }

  async function activateStudentSession(studentObj) {
    if (!studentObj) return;
    state.activeStudent = studentObj;
    activeStudentSelect.value = studentObj.student_id;
    localStorage.setItem('groupby_active_student_id', studentObj.student_id);
    await updateActiveProfileUI();
    authModal.classList.add('hidden');
    showMainApp();
    showDashboardLandingView();
    showToast(`Welcome to GroupBy, ${studentObj.name}!`, 'success');
  }

  function handleLandingSignIn() {
    openAuthModal();
  }

  const btnQuickDemoLogin = document.getElementById('btnQuickDemoLogin');
  const quickDemoSelect = document.getElementById('quickDemoSelect');

  if (btnQuickDemoLogin && quickDemoSelect) {
    btnQuickDemoLogin.addEventListener('click', async () => {
      const selectedId = parseInt(quickDemoSelect.value) || 1;
      const studentObj = (state.students || []).find(s => s.student_id === selectedId) || (state.students ? state.students[0] : null);
      if (studentObj) {
        await activateStudentSession(studentObj);
      } else {
        showToast('Loading campus profiles, please try again in a moment...', 'info');
      }
    });
  }

  if (btnLandingNavLogin) btnLandingNavLogin.addEventListener('click', handleLandingSignIn);
  if (btnLandingNavSignup) btnLandingNavSignup.addEventListener('click', handleLandingSignIn);
  if (btnLandingHeroSignIn) btnLandingHeroSignIn.addEventListener('click', handleLandingSignIn);

  async function checkSavedSession() {
    const savedId = parseInt(localStorage.getItem('groupby_active_student_id'));
    if (savedId && state.students && state.students.length > 0) {
      const savedStudent = state.students.find(s => s.student_id === savedId);
      if (savedStudent) {
        state.activeStudent = savedStudent;
        if (activeStudentSelect) activeStudentSelect.value = savedStudent.student_id;
        await updateActiveProfileUI();
        showMainApp();
        showDashboardLandingView();
        return;
      }
    }
    showLandingPage();
  }

  async function updateActiveProfileUI() {
    if (!state.activeStudent) return;

    const firstName = state.activeStudent.name.split(' ')[0];
    const initial = state.activeStudent.name.charAt(0);

    userGreeting.textContent = `Welcome back, ${firstName} 🥀`;
    userAvatarCircle.textContent = initial;
    userAvatarName.textContent = state.activeStudent.name;

    if (newTeamCreator) {
      newTeamCreator.value = `${state.activeStudent.name} (ID #${state.activeStudent.student_id})`;
    }

    await fetchStudentRequests();
    renderRightWidgets();
  }

  function renderCourseDropdowns() {
    const courseOpts = '<option value="">All Courses</option>' + 
      state.courses.map(c => `<option value="${c.course_id}">${c.course_code} - ${c.course_name}</option>`).join('');
    
    courseFilterSelect.innerHTML = courseOpts;

    const modalCourseOpts = '<option value="">None (General Project)</option>' + 
      state.courses.map(c => `<option value="${c.course_id}">${c.course_code} - ${c.course_name}</option>`).join('');
    
    newTeamCourse.innerHTML = modalCourseOpts;
  }

  function selectSkillInAddModal(skId) {
    const hiddenInput = document.getElementById('addSkillSelect');
    const labelElem = document.getElementById('addSkillDropdownLabel');
    const menuElem = document.getElementById('menuAddSkillDropdown');

    if (!skId || isNaN(skId)) {
      if (hiddenInput) hiddenInput.value = '';
      if (labelElem) labelElem.textContent = 'Select a skill';
      document.querySelectorAll('.add-skill-option').forEach(el => {
        el.style.background = '';
        const check = el.querySelector('.selected-check-icon');
        if (check) check.remove();
      });
      return;
    }

    const sk = state.skillsTaxonomy.find(s => s.skill_id === skId);
    if (!sk) return;

    if (hiddenInput) hiddenInput.value = sk.skill_id;
    if (labelElem) labelElem.textContent = `${sk.skill_name} (${sk.category_name})`;

    document.querySelectorAll('.add-skill-option').forEach(el => {
      const check = el.querySelector('.selected-check-icon');
      if (check) check.remove();
      if (parseInt(el.dataset.id) === skId) {
        el.style.background = '#f0fdf4';
        const icon = document.createElement('i');
        icon.className = 'ti ti-check selected-check-icon';
        icon.style.color = '#16a34a';
        icon.style.fontWeight = 'bold';
        el.appendChild(icon);
      } else {
        el.style.background = '';
      }
    });

    if (menuElem) menuElem.classList.add('hidden');
  }

  function renderAddSkillDropdown() {
    if (!state.skillsTaxonomy || state.skillsTaxonomy.length === 0) {
      if (typeof PREDEFINED_SKILLS_TAXONOMY_STATIC !== 'undefined') {
        state.skillsTaxonomy = PREDEFINED_SKILLS_TAXONOMY_STATIC;
      }
    }
    const customList = document.getElementById('addSkillCustomList');
    const sortedSkills = [...state.skillsTaxonomy].sort((a, b) =>
      a.skill_name.localeCompare(b.skill_name, undefined, { sensitivity: 'base' })
    );

    customList.innerHTML = sortedSkills.map(sk => `
      <div class="checkbox-option add-skill-option" data-id="${sk.skill_id}" data-name="${escapeHtml(sk.skill_name).toLowerCase()}" data-cat="${escapeHtml(sk.category_name).toLowerCase()}" style="padding: 6px 10px; cursor: pointer; user-select: none;">
        <span style="font-weight: 500;">${escapeHtml(sk.skill_name)}</span>
        <span style="font-size: 10.5px; color: var(--text-light); margin-left: auto;">(${escapeHtml(sk.category_name)})</span>
      </div>
    `).join('');

    document.querySelectorAll('.add-skill-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const skId = parseInt(opt.dataset.id);
        selectSkillInAddModal(skId);
      });
    });
  }

  function setupAddSkillCustomDropdown() {
    const btnDropdown = document.getElementById('btnAddSkillDropdownBtn');
    const menuDropdown = document.getElementById('menuAddSkillDropdown');
    const searchInput = document.getElementById('addSkillSearchInput');
    const btnClear = document.getElementById('btnClearAddSkillSelect');

    if (btnDropdown && menuDropdown) {
      btnDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menuDropdown.classList.contains('hidden');
        if (isHidden) {
          menuDropdown.classList.remove('hidden');
          if (searchInput) {
            searchInput.value = '';
            document.querySelectorAll('.add-skill-option').forEach(opt => opt.style.display = 'flex');
            searchInput.focus();
          }
        } else {
          menuDropdown.classList.add('hidden');
        }
      });

      menuDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.add-skill-option').forEach(opt => {
          const name = opt.dataset.name || '';
          const cat = opt.dataset.cat || '';
          if (!query || name.includes(query) || cat.includes(query)) {
            opt.style.display = 'flex';
          } else {
            opt.style.display = 'none';
          }
        });
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        selectSkillInAddModal(null);
        if (searchInput) {
          searchInput.value = '';
          document.querySelectorAll('.add-skill-option').forEach(opt => opt.style.display = 'flex');
        }
      });
    }

    document.addEventListener('click', () => {
      if (menuDropdown) menuDropdown.classList.add('hidden');
    });
  }

  async function openAddSkillModal(skId = null) {
    await ensureSkillsTaxonomy();
    renderAddSkillDropdown();

    const menuDropdown = document.getElementById('menuAddSkillDropdown');
    if (menuDropdown) menuDropdown.classList.add('hidden');

    const searchInput = document.getElementById('addSkillSearchInput');
    if (searchInput) {
      searchInput.value = '';
      document.querySelectorAll('.add-skill-option').forEach(opt => opt.style.display = 'flex');
    }

    if (skId) {
      selectSkillInAddModal(skId);
    } else {
      selectSkillInAddModal(null);
    }

    if (addSkillCredential) {
      addSkillCredential.value = '';
    }
    if (addSkillModal) {
      addSkillModal.classList.remove('hidden');
    }
  }

  // ------------------------------------------------------------
  // CONNECTION REQUESTS DATA FETCH
  // ------------------------------------------------------------
  async function fetchStudentRequests() {
    if (!state.activeStudent) return;

    try {
      const res = await fetch(`/api/requests/student/${state.activeStudent.student_id}`);
      const data = await res.json();

      if (data.success) {
        state.requests = data.data;
        const pendingCount = data.data.pending_incoming_count || 0;
        const outgoingCount = (data.data.outgoing || []).length;

        const dashMetricPendingElem = document.getElementById('dashMetricPending');
        const dashMetricRequestsSentElem = document.getElementById('dashMetricRequestsSent');
        if (dashMetricPendingElem) dashMetricPendingElem.textContent = pendingCount;
        if (dashMetricRequestsSentElem) dashMetricRequestsSentElem.textContent = outgoingCount;

        if (pendingCount > 0) {
          navRequestsBadge.textContent = pendingCount;
          navRequestsBadge.style.display = 'inline-block';
          headerBellBadge.textContent = pendingCount;
          headerBellBadge.style.display = 'flex';
        } else {
          navRequestsBadge.style.display = 'none';
          headerBellBadge.style.display = 'none';
        }
      }
    } catch (err) {
      console.warn('Could not fetch requests:', err);
    }
  }

  // ------------------------------------------------------------
  // VIEW NAVIGATION & SWITCHING
  // ------------------------------------------------------------
  function showDashboardLandingView() {
    state.currentView = 'dashboard';

    // Highlight Dashboard sidebar tab
    sidebarItems.forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="dashboard"]').classList.add('active');

    // Show Dashboard view & widgets
    dashboardView.classList.remove('hidden');
    dashWidgetsContainer.classList.remove('hidden');

    // Hide Feed view & feed widgets
    feedView.classList.add('hidden');
    feedWidgetsContainer.classList.add('hidden');

    updateProfileCompletionWidget();
  }

  function showSearchTeamsView() {
    state.currentView = 'search-teams';

    sidebarItems.forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="search-teams"]').classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');
    filterBarContainer.style.display = 'flex';

    loadDashboard();
  }

  function showSearchStudentsView() {
    state.currentView = 'search-students';

    sidebarItems.forEach(i => i.classList.remove('active'));
    document.querySelector('[data-tab="search-students"]').classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');
    filterBarContainer.style.display = 'flex';

    loadCandidateSearchFeed();
  }

  function setupEventListeners() {
    activeStudentSelect.addEventListener('change', async (e) => {
      const stId = parseInt(e.target.value);
      state.activeStudent = state.students.find(s => s.student_id === stId);
      localStorage.setItem('groupby_active_student_id', stId);
      await updateActiveProfileUI();
      if (state.currentView === 'my-profile') loadMyProfileFeed();
      else if (state.currentView === 'requests') loadRequestsFeed();
      else if (state.currentView === 'team-merges') showTeamMergesFeed();
      else if (state.currentView === 'search-students') loadCandidateSearchFeed();
      else if (state.currentView === 'search-teams') loadDashboard();
      else showDashboardLandingView();
    });

    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab === 'dashboard') {
          showDashboardLandingView();
        } else if (tab === 'search-teams') {
          showSearchTeamsView();
        } else if (tab === 'search-students') {
          showSearchStudentsView();
        } else if (tab === 'team-merges') {
          switchToTab('team-merges');
        } else if (tab === 'my-profile') {
          switchToTab('my-profile');
        } else if (tab === 'requests') {
          switchToTab('requests');
        } else if (tab === 'my-teams') {
          showMyTeamsFeed();
        } else if (tab === 'collaborations') {
          showCollaborationsFeed();
        }
      });
    });

    // Dashboard Hero Choice Card Click Handlers
    dashBtnJoin.addEventListener('click', () => {
      showSearchTeamsView();
    });

    dashBtnFill.addEventListener('click', () => {
      showSearchStudentsView();
    });

    if (btnDashEditProfile) {
      btnDashEditProfile.addEventListener('click', () => {
        openEditProfileModal();
      });
    }

    // User Avatar & Logout buttons
    btnUserPill.addEventListener('click', () => openAuthModal());
    btnLogout.addEventListener('click', () => {
      state.activeStudent = null;
      localStorage.removeItem('groupby_active_student_id');
      showLandingPage();
      showToast('Signed out of campus account.', 'info');
    });

    // Auth Modal Tabs & Forms
    if (btnCloseAuthModal) btnCloseAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

    if (tabAuthLogin) {
      tabAuthLogin.addEventListener('click', () => {
        tabAuthLogin.style.background = 'var(--accent-dark)';
        tabAuthLogin.style.color = '#fff';
        if (tabAuthRegister) {
          tabAuthRegister.style.background = 'transparent';
          tabAuthRegister.style.color = 'var(--text-sub)';
        }
        if (authModalTitle) authModalTitle.textContent = 'Sign In to GroupBy';
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
      });
    }

    if (tabAuthRegister) {
      tabAuthRegister.addEventListener('click', () => {
        tabAuthRegister.style.background = 'var(--accent-dark)';
        tabAuthRegister.style.color = '#fff';
        if (tabAuthLogin) {
          tabAuthLogin.style.background = 'transparent';
          tabAuthLogin.style.color = 'var(--text-sub)';
        }
        if (authModalTitle) authModalTitle.textContent = 'Create Student Account';
        if (registerForm) registerForm.classList.remove('hidden');
        if (loginForm) loginForm.classList.add('hidden');
      });
    }

    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

    // Edit Profile Modal & Forms
    btnCloseEditProfileModal.addEventListener('click', () => editProfileModal.classList.add('hidden'));
    editProfileForm.addEventListener('submit', handleEditProfileSubmit);

    btnCloseAddSkillModal.addEventListener('click', () => addSkillModal.classList.add('hidden'));
    addSkillForm.addEventListener('submit', handleAddSkillSubmit);

    btnEditSkills.addEventListener('click', () => {
      switchToTab('my-profile');
    });

    // Header Bell & Widget Request link
    if (btnHeaderBell) {
      btnHeaderBell.addEventListener('click', () => {
        switchToTab('requests');
      });
    }

    if (btnWidgetViewRequests) {
      btnWidgetViewRequests.addEventListener('click', () => {
        switchToTab('requests');
      });
    }

    const btnViewAllTeams = document.getElementById('btnViewAllTeams');
    if (btnViewAllTeams) {
      btnViewAllTeams.addEventListener('click', () => {
        showMyTeamsFeed();
      });
    }

    const btnViewAllCollabs = document.getElementById('btnViewAllCollabs');
    if (btnViewAllCollabs) {
      btnViewAllCollabs.addEventListener('click', () => {
        showCollaborationsFeed();
      });
    }

    // Multi-select Filter controls
    setupMultiSelectDropdowns();
    setupAddSkillCustomDropdown();

    btnSearchSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      triggerFilterSearch();
    });

    btnSearchReset.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.branch-checkbox, .sem-checkbox, .skill-checkbox').forEach(cb => cb.checked = false);
      updateBranchDropdownLabel();
      updateSemesterDropdownLabel();
      updateSkillDropdownLabel();
      triggerFilterSearch();
    });

    // Modals
    btnCloseModal.addEventListener('click', () => createTeamModal.classList.add('hidden'));
    createTeamForm.addEventListener('submit', handleCreateTeamSubmit);

    btnCloseRequestModal.addEventListener('click', () => sendRequestModal.classList.add('hidden'));
    sendRequestForm.addEventListener('submit', handleSendRequestSubmit);

    btnCloseContactModal.addEventListener('click', () => contactInfoModal.classList.add('hidden'));
  }

  function openAuthModal() {
    hideGoogleAuthError();
    const gSec = document.getElementById('googleAuthSection');
    const rForm = document.getElementById('registerForm');
    if (gSec) gSec.classList.remove('hidden');
    if (rForm) rForm.classList.add('hidden');
    
    initGoogleOAuth();

    if (btnGoogleAuth && (!googleSignInBtnContainer || !googleSignInBtnContainer.hasChildNodes())) {
      btnGoogleAuth.style.display = 'flex';
    }

    authModal.classList.remove('hidden');
  }

  function formatProfileUrl(url, type) {
    if (!url) return '';
    let href = url.trim();
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      if (type === 'linkedin') href = 'https://linkedin.com/in/' + href.replace(/^@/, '');
      else if (type === 'github') href = 'https://github.com/' + href.replace(/^@/, '');
      else if (type === 'leetcode') href = 'https://leetcode.com/u/' + href.replace(/^@/, '');
      else if (type === 'instagram') href = 'https://instagram.com/' + href.replace(/^@/, '');
      else href = 'https://' + href;
    }
    return href;
  }

  function renderCredentialBadges(user) {
    if (!user) return '';
    let html = '<div class="cred-badges-wrap" style="margin-top: 6px;">';
    let count = 0;
    if (user.linkedin_url) {
      const link = formatProfileUrl(user.linkedin_url, 'linkedin');
      html += `<a href="${link}" target="_blank" rel="noopener" class="cred-badge linkedin" title="LinkedIn Profile"><i class="ti ti-brand-linkedin"></i> LinkedIn</a>`;
      count++;
    }
    if (user.github_url) {
      const link = formatProfileUrl(user.github_url, 'github');
      html += `<a href="${link}" target="_blank" rel="noopener" class="cred-badge github" title="GitHub Profile"><i class="ti ti-brand-github"></i> GitHub</a>`;
      count++;
    }
    if (user.leetcode_url) {
      const link = formatProfileUrl(user.leetcode_url, 'leetcode');
      html += `<a href="${link}" target="_blank" rel="noopener" class="cred-badge leetcode" title="LeetCode Profile"><i class="ti ti-code"></i> LeetCode</a>`;
      count++;
    }
    html += '</div>';
    return count > 0 ? html : '';
  }

  async function openEditProfileModal() {
    if (!state.activeStudent) {
      openAuthModal();
      return;
    }

    try {
      const res = await fetch(`/api/students/${state.activeStudent.student_id}?requester_id=${state.activeStudent.student_id}`);
      const data = await res.json();
      if (data.success && data.data) {
        state.activeStudent = data.data;
      }
    } catch (e) {
      console.warn('Failed to refresh active student before edit modal:', e);
    }

    const st = state.activeStudent;
    editName.value = st.name || '';
    editBranch.value = st.branch || '';
    editSemester.value = st.semester || '';

    const cleanContact = (!st.contact_info || st.contact_info.includes('[Hidden')) ? '' : st.contact_info;
    if (cleanContact.includes('Mobile:') || cleanContact.includes('Insta:')) {
      const mobileMatch = cleanContact.match(/Mobile:\s*([^|]+)/i);
      const instaMatch = cleanContact.match(/Insta:\s*(.+)/i);
      if (editMobile) editMobile.value = mobileMatch ? mobileMatch[1].trim() : '';
      if (editInstagram) editInstagram.value = instaMatch ? instaMatch[1].trim() : '';
    } else {
      if (editMobile) editMobile.value = cleanContact;
      if (editInstagram) editInstagram.value = '';
    }

    if (editLinkedin) editLinkedin.value = (!st.linkedin_url || st.linkedin_url.includes('[Hidden')) ? '' : (st.linkedin_url || '');
    if (editGithub) editGithub.value = (!st.github_url || st.github_url.includes('[Hidden')) ? '' : (st.github_url || '');
    if (editLeetcode) editLeetcode.value = (!st.leetcode_url || st.leetcode_url.includes('[Hidden')) ? '' : (st.leetcode_url || '');

    editProfileModal.classList.remove('hidden');
  }


  // ------------------------------------------------------------
  // GOOGLE OAUTH 2.0 HANDLERS (@thapar.edu restricted)
  // ------------------------------------------------------------
  let googleClientId = '';

  async function initGoogleOAuth() {
    try {
      if (!googleClientId) {
        const res = await fetch('/api/auth/google/config');
        const data = await res.json();
        googleClientId = data.clientId || '';
      }

      if (googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          hosted_domain: 'thapar.edu'
        });

        if (googleSignInBtnContainer) {
          googleSignInBtnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(googleSignInBtnContainer, {
            theme: 'outline',
            size: 'large',
            width: '360',
            text: 'continue_with',
            logo_alignment: 'left'
          });
          if (btnGoogleAuth) {
            btnGoogleAuth.style.display = 'none';
          }
        }
      } else {
        if (btnGoogleAuth) {
          btnGoogleAuth.style.display = 'flex';
        }
      }
    } catch (err) {
      console.warn('Google OAuth config lookup failed:', err);
      if (btnGoogleAuth) {
        btnGoogleAuth.style.display = 'flex';
      }
    }
  }

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', () => {
      hideGoogleAuthError();

      if (googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt();
      } else {
        // Interactive prompt for testing @thapar.edu vs non-thapar email addresses
        const userEmail = prompt(
          "Google OAuth Sign-In Simulation (@thapar.edu restricted):\n\nEnter your Google email address to test login (e.g. shresth.v@thapar.edu or personal@gmail.com):",
          "shresth.v@thapar.edu"
        );
        if (userEmail) {
          submitGoogleOAuthTest(userEmail);
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    const checkGoogleInterval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(checkGoogleInterval);
        initGoogleOAuth();
      }
    }, 300);
    setTimeout(() => clearInterval(checkGoogleInterval), 5000);
  }

  async function submitGoogleOAuthTest(email) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: email })
      });
      const data = await res.json();
      handleGoogleOAuthServerResponse(data);
    } catch (err) {
      showGoogleAuthError('Google Sign-In failed: ' + err.message);
    }
  }

  async function handleGoogleCredentialResponse(response) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      handleGoogleOAuthServerResponse(data);
    } catch (err) {
      showGoogleAuthError('Google Sign-In verification failed: ' + err.message);
    }
  }

  function handleGoogleOAuthServerResponse(data) {
    if (!data.success) {
      showGoogleAuthError(data.error || 'Access Restricted: Only @thapar.edu email addresses are permitted.');
      showToast(data.error || 'Access Restricted: Non-@thapar.edu email rejected.', 'error');
      return;
    }

    hideGoogleAuthError();

    if (data.user) {
      showToast(data.message || 'Successfully logged in with Google!', 'success');
      authModal.classList.add('hidden');
      state.activeStudent = data.user;
      localStorage.setItem('groupby_active_student_id', data.user.student_id);

      showMainApp();
      showDashboardLandingView();
      fetchMetadata();
      updateActiveProfileUI();
    } else if (data.requiresRegistration) {
      showToast(data.message, 'info');
      const gSec = document.getElementById('googleAuthSection');
      const rForm = document.getElementById('registerForm');
      if (gSec) gSec.classList.add('hidden');
      if (rForm) rForm.classList.remove('hidden');
      if (regName) regName.value = data.name || '';
      if (regEmail) regEmail.value = data.email || '';
      if (regRollNo) regRollNo.focus();
    }
  }

  function showGoogleAuthError(msg) {
    if (googleAuthError && googleAuthErrorText) {
      googleAuthErrorText.textContent = msg;
      googleAuthError.classList.remove('hidden');
    }
  }

  function hideGoogleAuthError() {
    if (googleAuthError) {
      googleAuthError.classList.add('hidden');
    }
  }


  function switchToTab(tabName) {
    sidebarItems.forEach(i => i.classList.remove('active'));
    const targetItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetItem) targetItem.classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) {
      teamMergeSection.classList.add('hidden');
    }

    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) {
      if (tabName === 'search-teams') btnLoadMore.style.display = 'block';
      else btnLoadMore.style.display = 'none';
    }

    if (tabName === 'my-profile') {
      state.currentView = 'my-profile';
      filterBarContainer.style.display = 'none';
      loadMyProfileFeed();
    } else if (tabName === 'requests') {
      state.currentView = 'requests';
      filterBarContainer.style.display = 'none';
      loadRequestsFeed();
    } else if (tabName === 'team-merges') {
      state.currentView = 'team-merges';
      filterBarContainer.style.display = 'none';
      showTeamMergesFeed();
    } else if (tabName === 'search-students') {
      state.currentView = 'search-students';
      filterBarContainer.style.display = 'flex';
      loadCandidateSearchFeed();
    } else {
      state.currentView = 'search-teams';
      filterBarContainer.style.display = 'flex';
      loadDashboard();
    }
  }

  // ------------------------------------------------------------
  // MY TEAMS, COLLABORATIONS & SKILL CATEGORIES FEEDS
  // ------------------------------------------------------------
  function showMyTeamsFeed() {
    state.currentView = 'my-teams';
    sidebarItems.forEach(i => i.classList.remove('active'));
    const item = document.querySelector('[data-tab="my-teams"]');
    if (item) item.classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');
    filterBarContainer.style.display = 'none';

    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) btnLoadMore.style.display = 'none';

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    feedTitleText.textContent = 'My Teams & Created Projects';
    feedOpenSlotsBadge.textContent = 'Active Memberships';

    if (!state.activeStudent) {
      teamsFeedList.innerHTML = '<div style="padding:40px; text-align:center;">Please sign in to view your teams.</div>';
      return;
    }

    const myTeams = state.teams.filter(t => 
      t.creator_id === state.activeStudent.student_id ||
      (t.members && t.members.some(m => m.student_id === state.activeStudent.student_id))
    );

    if (myTeams.length === 0) {
      teamsFeedList.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
          <i class="ti ti-users-group" style="font-size: 36px; color: var(--accent-rust);"></i>
          <p style="margin-top: 10px; font-size: 16px; font-weight: 700; color: var(--text-dark);">No Teams Joined or Created Yet</p>
          <p style="font-size: 13px; color: var(--text-sub); margin-top: 4px;">Join an open team slot or create your own project team!</p>
          <button class="btn-search" onclick="document.getElementById('createTeamModal').classList.remove('hidden')" style="margin-top: 16px; border-radius: 20px; font-size: 13.5px; padding: 8px 18px;">
            <i class="ti ti-plus"></i> Create New Team
          </button>
        </div>
      `;
      return;
    }

    teamsFeedList.innerHTML = myTeams.map(t => {
      const isCreator = t.creator_id === state.activeStudent.student_id;
      const roleLabel = isCreator ? 'Team Creator & Admin' : 'Active Member';
      const membersListHtml = (t.members || []).map(m => `
        <span class="skill-pill" style="background: #f1f5f9; color: #334155; font-size: 12px;">
          <i class="ti ti-user" style="font-size: 11px;"></i> ${escapeHtml(m.name)} (${escapeHtml(m.branch)} Sem ${m.semester})
        </span>
      `).join('');

      const openSlotsCount = (t.slots || []).filter(s => s.slot_status === 'open').length;

      return `
        <div class="request-card" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <div style="font-family: var(--font-manrope); font-size: 20px; font-weight: 700; color: var(--text-dark);">${escapeHtml(t.team_name)}</div>
              <div style="font-size: 13px; color: var(--accent-rust); margin-top: 2px; font-weight: 500;">
                ${t.course_code ? t.course_code + ' - ' + t.course_name : 'General Project'}
              </div>
            </div>
            <span class="status-badge ${isCreator ? 'accepted' : 'pending'}">${roleLabel}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: var(--text-light); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Team Roster (${t.members ? t.members.length : 1} Members)</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${membersListHtml}</div>
          </div>

          <div style="background: #faf9f6; border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12.5px; color: var(--text-dark);">
              <strong>Status:</strong> ${t.status || 'open'} • <strong>Open Recruitment Slots:</strong> ${openSlotsCount}
            </div>
            <button class="btn-request btn-open-create-slot" data-team-id="${t.team_id}" data-team-name="${escapeHtml(t.team_name)}" style="font-size: 12px; padding: 5px 12px;">
              <i class="ti ti-plus"></i> Add Slot
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-open-create-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const teamId = parseInt(e.currentTarget.dataset.teamId);
        const teamName = e.currentTarget.dataset.teamName;
        promptCreateSlotForTeam(teamId, teamName);
      });
    });
  }

  function showCollaborationsFeed() {
    state.currentView = 'collaborations';
    sidebarItems.forEach(i => i.classList.remove('active'));
    const item = document.querySelector('[data-tab="collaborations"]');
    if (item) item.classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');
    filterBarContainer.style.display = 'none';

    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) btnLoadMore.style.display = 'none';

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    feedTitleText.textContent = 'Past & Active Collaborations';
    feedOpenSlotsBadge.textContent = 'Teammate History';

    if (!state.activeStudent) {
      teamsFeedList.innerHTML = '<div style="padding:40px; text-align:center;">Please sign in to view collaboration history.</div>';
      return;
    }

    const acceptedIncoming = (state.requests.incoming || []).filter(r => r.status === 'accepted');
    const acceptedOutgoing = (state.requests.outgoing || []).filter(r => r.status === 'accepted');

    if (acceptedIncoming.length === 0 && acceptedOutgoing.length === 0) {
      teamsFeedList.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
          <i class="ti ti-history" style="font-size: 36px; color: var(--accent-rust);"></i>
          <p style="margin-top: 10px; font-size: 16px; font-weight: 700; color: var(--text-dark);">No Completed Collaborations Yet</p>
          <p style="font-size: 13px; color: var(--text-sub); margin-top: 4px;">Once you accept connection requests or join team slots, your teammate collaboration history will be stored here!</p>
        </div>
      `;
      return;
    }

    let collabsHtml = '';

    if (acceptedIncoming.length > 0) {
      collabsHtml += `<h4 style="font-family: var(--font-manrope); font-size: 18px; margin-bottom: 12px; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="ti ti-users"></i> Teammates Recruited (${acceptedIncoming.length})</h4>`;

      collabsHtml += acceptedIncoming.map(r => `
        <div class="request-card" style="border-left: 4px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: var(--text-dark);">${escapeHtml(r.applicant_name)} (${r.applicant_branch} Sem ${r.applicant_semester})</div>
              <div style="font-size: 12.5px; color: var(--text-sub); margin-top: 2px;">Recruited into <strong>${escapeHtml(r.team_name)}</strong> • Slot #${r.slot_id}</div>
            </div>
            <span class="status-badge accepted">Active Teammate</span>
          </div>

          <div class="contact-unlocked-box" style="margin-top: 10px;">
            <h6><i class="ti ti-address-book"></i> Teammate Contact Info</h6>
            <p><strong>Email:</strong> <a href="mailto:${r.applicant_email}" style="color: var(--accent-rust); text-decoration: underline;">${r.applicant_email}</a></p>
            <p><strong>Handles / Phone:</strong> ${escapeHtml(r.applicant_contact)}</p>
          </div>
        </div>
      `).join('');
    }

    if (acceptedOutgoing.length > 0) {
      collabsHtml += `<h4 style="font-family: var(--font-manrope); font-size: 18px; margin: 24px 0 12px 0; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="ti ti-user-check"></i> Teams Joined (${acceptedOutgoing.length})</h4>`;

      collabsHtml += acceptedOutgoing.map(r => `
        <div class="request-card" style="border-left: 4px solid var(--accent-rust);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: var(--text-dark);">${escapeHtml(r.team_name)}</div>
              <div style="font-size: 12.5px; color: var(--text-sub); margin-top: 2px;">Created by <strong>${escapeHtml(r.team_creator_name)}</strong> ${r.course_code ? '• ' + r.course_code : ''}</div>
            </div>
            <span class="status-badge accepted">Joined Project</span>
          </div>

          <div class="contact-unlocked-box" style="margin-top: 10px;">
            <h6><i class="ti ti-address-book"></i> Team Lead Contact Info</h6>
            <p><strong>Email:</strong> <a href="mailto:${r.team_creator_email}" style="color: var(--accent-rust); text-decoration: underline;">${r.team_creator_email}</a></p>
            <p><strong>Handles / Phone:</strong> ${escapeHtml(r.team_creator_contact)}</p>
          </div>
        </div>
      `).join('');
    }

    teamsFeedList.innerHTML = collabsHtml;
  }

  function showSkillCategoriesFeed() {
    state.currentView = 'skill-categories';
    sidebarItems.forEach(i => i.classList.remove('active'));
    const item = document.querySelector('[data-tab="skill-categories"]');
    if (item) item.classList.add('active');

    dashboardView.classList.add('hidden');
    dashWidgetsContainer.classList.add('hidden');

    feedView.classList.remove('hidden');
    feedWidgetsContainer.classList.remove('hidden');
    filterBarContainer.style.display = 'none';

    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) btnLoadMore.style.display = 'none';

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    feedTitleText.textContent = 'Skill Categories';
    feedOpenSlotsBadge.textContent = 'Taxonomy Explorer';

    if (!state.skillsTaxonomy || state.skillsTaxonomy.length === 0) {
      teamsFeedList.innerHTML = '<div style="padding:40px; text-align:center;">Loading skills taxonomy...</div>';
      return;
    }

    const categoriesMap = {};
    state.skillsTaxonomy.forEach(sk => {
      const cat = sk.category_name || 'General';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(sk);
    });

    const categoriesList = Object.keys(categoriesMap);

    teamsFeedList.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${categoriesList.map(catName => {
          const skillsInCat = categoriesMap[catName];
          const skillsPillsHtml = skillsInCat.map(sk => {
            const hasSkill = state.activeStudent && state.activeStudent.skills && state.activeStudent.skills.some(s => s.skill_id === sk.skill_id);
            return `
              <div style="display: inline-flex; align-items: center; justify-content: space-between; background: #faf9f6; border: 1px solid var(--card-border); padding: 7px 11px; border-radius: 6px; font-size: 13px; margin-bottom: 6px;">
                <span style="font-weight: 600; color: var(--text-dark);">${escapeHtml(sk.skill_name)}</span>
                ${hasSkill 
                  ? `<span style="font-size: 10.5px; background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600;"><i class="ti ti-check"></i> Added</span>` 
                  : `<button class="btn-request btn-add-cat-skill" data-skill-id="${sk.skill_id}" style="font-size: 11px; padding: 2px 8px; border-radius: 4px;"><i class="ti ti-plus"></i> Add</button>`
                }
              </div>
            `;
          }).join('');

          return `
            <div class="request-card" style="padding: 18px; margin-bottom: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--card-border); padding-bottom: 10px; margin-bottom: 12px;">
                <div style="font-family: var(--font-manrope); font-size: 17px; font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
                  <i class="ti ti-folder" style="color: var(--accent-rust);"></i> ${escapeHtml(catName)}
                </div>
                <span class="count-pill" style="font-size: 11.5px;">${skillsInCat.length} Skills</span>
              </div>
              <div style="display: flex; flex-direction: column;">
                ${skillsPillsHtml}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.querySelectorAll('.btn-add-cat-skill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const skId = parseInt(e.currentTarget.dataset.skillId);
        if (!state.activeStudent) {
          openAuthModal();
          return;
        }

        openAddSkillModal(skId);
      });
    });
  }

  async function promptCreateSlotForTeam(teamId, teamName) {
    if (!state.skillsTaxonomy || state.skillsTaxonomy.length === 0) return;

    const skillListStr = state.skillsTaxonomy.map(s => `${s.skill_id}: ${s.category_name} - ${s.skill_name}`).slice(0, 15).join('\n');
    const input = prompt(`Create open slot for team "${teamName}":\n\nEnter required Skill ID number (1 to ${state.skillsTaxonomy.length}):\n\nSample Skills:\n${skillListStr}`, "1");
    
    if (!input) return;
    const skillId = parseInt(input);
    if (isNaN(skillId)) return;

    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          skill_ids: [skillId]
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Open slot added to team!', 'success');
      await fetchMetadata();
      showMyTeamsFeed();
    } catch (err) {
      showToast('Error adding slot: ' + err.message, 'error');
    }
  }


  // ------------------------------------------------------------
  // AUTHENTICATION SUBMIT HANDLERS (@thapar.edu restricted)
  // ------------------------------------------------------------
  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email.toLowerCase().endsWith('@thapar.edu')) {
      showToast('Error: Only official emails ending with @thapar.edu are permitted.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(data.message, 'success');
      authModal.classList.add('hidden');
      loginPassword.value = '';

      state.activeStudent = data.user;
      localStorage.setItem('groupby_active_student_id', data.user.student_id);

      showMainApp();
      showDashboardLandingView();
      fetchMetadata();
      updateActiveProfileUI();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();

    const name = regName ? regName.value.trim() : '';
    const email = regEmail ? regEmail.value.trim() : '';
    const rollNo = regRollNo ? regRollNo.value.trim() : '';
    const branch = regBranch ? regBranch.value : '';
    const semester = regSemester ? parseInt(regSemester.value) : 1;
    const password = regPassword ? regPassword.value : 'thapar123';

    const mobile = regMobile ? regMobile.value.trim() : '';
    const instagram = regInstagram ? regInstagram.value.trim() : '';
    const contactInfo = instagram ? `Mobile: ${mobile} | Insta: ${instagram}` : `Mobile: ${mobile}`;

    const linkedinUrl = regLinkedin ? formatProfileUrl(regLinkedin.value, 'linkedin') : '';
    const githubUrl = regGithub ? formatProfileUrl(regGithub.value, 'github') : '';
    const leetcodeUrl = regLeetcode ? formatProfileUrl(regLeetcode.value, 'leetcode') : '';

    if (!email.toLowerCase().endsWith('@thapar.edu')) {
      showToast('Error: Registration is strictly restricted to @thapar.edu email addresses.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          roll_no: rollNo,
          branch,
          semester,
          password,
          contact_info: contactInfo,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          leetcode_url: leetcodeUrl
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Registration successful! Welcome to GroupBy.', 'success');
      authModal.classList.add('hidden');

      if (regName) regName.value = '';
      if (regEmail) regEmail.value = '';
      if (regRollNo) regRollNo.value = '';
      if (regPassword) regPassword.value = '';
      if (regMobile) regMobile.value = '';
      if (regInstagram) regInstagram.value = '';
      if (regLinkedin) regLinkedin.value = '';
      if (regGithub) regGithub.value = '';
      if (regLeetcode) regLeetcode.value = '';

      state.activeStudent = data.user;
      localStorage.setItem('groupby_active_student_id', data.user.student_id);

      showMainApp();
      showDashboardLandingView();
      fetchMetadata();
      updateActiveProfileUI();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ------------------------------------------------------------
  // MY PROFILE FEED & SKILL MANAGEMENT
  // ------------------------------------------------------------
  async function loadMyProfileFeed() {
    feedTitleText.textContent = 'My Profile & Skills';
    feedOpenSlotsBadge.textContent = 'Student Account';

    if (!state.activeStudent) return;

    try {
      const res = await fetch(`/api/students/${state.activeStudent.student_id}?requester_id=${state.activeStudent.student_id}`);
      const data = await res.json();
      if (data.success) {
        state.activeStudent = data.data;
      }
    } catch (err) {
      console.warn(err);
    }

    const st = state.activeStudent;
    const skillsHtml = (st.skills && st.skills.length > 0)
      ? st.skills.map(sk => `
          <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--tag-bg); padding: 5px 10px; border-radius: 6px; font-size: 13px; font-weight: 500;">
            <span>${escapeHtml(sk.skill_name)} (${sk.proficiency || 'intermediate'})</span>
            ${sk.credential_url ? `<a href="${formatProfileUrl(sk.credential_url, 'general')}" target="_blank" rel="noopener" class="skill-cred-link" title="Verify Certificate / Proof"><i class="ti ti-certificate"></i> Proof</a>` : ''}
            <i class="ti ti-x btn-delete-skill" data-skill-id="${sk.skill_id}" style="cursor: pointer; font-size: 14px; color: var(--text-sub);" title="Remove Skill"></i>
          </div>
        `).join('')
      : '<p style="font-size: 13px; color: var(--text-sub);">No skills added yet.</p>';

    teamsFeedList.innerHTML = `
      <div class="request-card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--card-border); padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <div class="avatar-circle" style="width: 56px; height: 56px; font-size: 22px;">${getInitials(st.name)}</div>
            <div>
              <h3 style="font-family: var(--font-manrope); font-size: 22px; font-weight: 700; color: var(--text-dark);">${escapeHtml(st.name)}</h3>
              <p style="font-size: 13.5px; color: var(--accent-rust); font-weight: 600; margin-top: 2px;">${escapeHtml(st.email)}</p>
              ${renderCredentialBadges(st)}
            </div>
          </div>
          <button id="btnOpenEditProfile" class="btn-reset" style="font-size: 14px; padding: 7px 16px;"><i class="ti ti-edit"></i> Edit Info</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
          <div style="background: #faf9f6; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-size: 11px; color: var(--text-sub); text-transform: uppercase; font-weight: 600;">Roll Number</div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.roll_no)}</div>
          </div>
          <div style="background: #faf9f6; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-size: 11px; color: var(--text-sub); text-transform: uppercase; font-weight: 600;">Branch & Semester</div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.branch)} • Semester ${st.semester}</div>
          </div>
          <div style="background: #faf9f6; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-size: 11px; color: var(--text-sub); text-transform: uppercase; font-weight: 600;">Contact Details</div>
            <div style="font-size: 13.5px; font-weight: 600; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.contact_info || 'Not provided')}</div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--card-border); padding-top: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-family: var(--font-manrope); font-size: 18px; font-weight: 600; color: var(--text-dark);">Your Skills Taxonomy</h4>
            <button id="btnOpenAddSkill" class="btn-search" style="font-size: 13px; padding: 6px 14px; background: var(--accent-rust);"><i class="ti ti-plus"></i> Add Skill</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${skillsHtml}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnOpenEditProfile').addEventListener('click', () => {
      openEditProfileModal();
    });

    document.getElementById('btnOpenAddSkill').addEventListener('click', () => {
      openAddSkillModal();
    });

    document.querySelectorAll('.btn-delete-skill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const skId = parseInt(e.currentTarget.dataset.skillId);
        handleDeleteSkill(skId);
      });
    });
  }

  async function handleEditProfileSubmit(e) {
    e.preventDefault();
    if (!state.activeStudent) return;

    const mobile = editMobile ? editMobile.value.trim() : '';
    const instagram = editInstagram ? editInstagram.value.trim() : '';
    const contactInfo = instagram ? `Mobile: ${mobile} | Insta: ${instagram}` : `Mobile: ${mobile}`;

    try {
      const res = await fetch(`/api/students/${state.activeStudent.student_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.value.trim(),
          branch: editBranch.value,
          semester: parseInt(editSemester.value),
          contact_info: contactInfo,
          linkedin_url: editLinkedin ? formatProfileUrl(editLinkedin.value, 'linkedin') : '',
          github_url: editGithub ? formatProfileUrl(editGithub.value, 'github') : '',
          leetcode_url: editLeetcode ? formatProfileUrl(editLeetcode.value, 'leetcode') : ''
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Profile updated successfully!', 'success');
      editProfileModal.classList.add('hidden');
      state.activeStudent = data.user;
      await updateActiveProfileUI();
      loadMyProfileFeed();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }

  async function handleAddSkillSubmit(e) {
    e.preventDefault();
    if (!state.activeStudent) return;

    const skillId = parseInt(addSkillSelect.value);
    const proficiency = addSkillProficiency.value;
    const credentialUrl = addSkillCredential ? addSkillCredential.value.trim() : '';

    try {
      const res = await fetch(`/api/students/${state.activeStudent.student_id}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId, proficiency, credential_url: credentialUrl })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Skill added to profile!', 'success');
      addSkillModal.classList.add('hidden');
      if (addSkillCredential) addSkillCredential.value = '';

      state.activeStudent.skills = data.skills;
      renderRightWidgets();
      loadMyProfileFeed();
    } catch (err) {
      showToast('Error adding skill: ' + err.message, 'error');
    }
  }

  async function handleDeleteSkill(skillId) {
    if (!state.activeStudent) return;

    try {
      const res = await fetch(`/api/students/${state.activeStudent.student_id}/skills/${skillId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Skill removed.', 'info');
      state.activeStudent.skills = data.skills;
      renderRightWidgets();
      loadMyProfileFeed();
    } catch (err) {
      showToast('Error deleting skill: ' + err.message, 'error');
    }
  }

  // ------------------------------------------------------------
  // MAIN TEAMS FEED (Search Teams & Team Merge Suggestions)
  // ------------------------------------------------------------
  async function loadTeamMergeSuggestions() {
    const teamMergeSection = document.getElementById('teamMergeSection');
    const teamMergeList = document.getElementById('teamMergeList');
    const teamMergeCountBadge = document.getElementById('teamMergeCountBadge');

    if (!state.activeStudent || !teamMergeSection || !teamMergeList) return;

    try {
      const res = await fetch(`/api/search/team-merges?student_id=${state.activeStudent.student_id}`);
      const data = await res.json();

      if (data.success && data.suggestions && data.suggestions.length > 0) {
        teamMergeSection.classList.remove('hidden');
        teamMergeCountBadge.textContent = `${data.suggestions.length} Merge Suggestion${data.suggestions.length > 1 ? 's' : ''}`;

        teamMergeList.innerHTML = data.suggestions.map(s => {
          const badgeClass = s.is_exact_match ? 'exact' : 'partial';
          const badgeLabel = s.is_exact_match ? '100% Exact Complementary Merge' : `Partial Merge (${s.match_percentage}%)`;

          const skillsAProvides = s.skills_a_provides_to_b.map(sk => `<span class="skill-pill">${sk.skill_name}</span>`).join('');
          const skillsBProvides = s.skills_b_provides_to_a.map(sk => `<span class="skill-pill">${sk.skill_name}</span>`).join('');

          const req = s.connection_request;
          let actionBtnHtml = '';

          if (!req) {
            actionBtnHtml = `<button class="btn-request btn-open-merge-modal" data-slot-id="${s.team_b.target_slot_id || ''}" data-student-id="${s.team_b.target_student_id || ''}" data-team-b-name="${escapeHtml(s.team_b.team_name)}"><i class="ti ti-git-merge"></i> Request Team Merge</button>`;
          } else if (req.status === 'pending') {
            actionBtnHtml = `<button class="btn-request pending"><i class="ti ti-clock"></i> Merge Request Pending</button>`;
          } else if (req.status === 'accepted') {
            actionBtnHtml = `<button class="btn-request accepted btn-view-contact"><i class="ti ti-check"></i> Merged / Connected</button>`;
          } else {
            actionBtnHtml = `<button class="btn-request btn-open-merge-modal" data-slot-id="${s.team_b.target_slot_id || ''}" data-student-id="${s.team_b.target_student_id || ''}" data-team-b-name="${escapeHtml(s.team_b.team_name)}"><i class="ti ti-refresh"></i> Request Team Merge</button>`;
          }

          return `
            <div class="team-merge-card">
              <div class="merge-header">
                <div class="merge-teams-title">
                  <span>${s.team_a.team_name}</span>
                  <i class="ti ti-arrows-exchange" style="color: var(--accent-rust); font-size: 18px;"></i>
                  <span>${s.team_b.team_name}</span>
                </div>
                <span class="merge-match-badge ${badgeClass}">${badgeLabel}</span>
              </div>

              <div style="font-size: 12.5px; color: var(--text-sub);">
                These two teams have complementary skill profiles. Instead of searching individually, both teams can combine forces!
              </div>

              <div class="skills-exchange-grid">
                <div class="exchange-col">
                  <span class="exchange-label">${s.team_a.team_name} provides to ${s.team_b.team_name}:</span>
                  <div class="skill-pills-row">${skillsAProvides || '<span style="font-size:12px; color:var(--text-light);">Complementary Skills</span>'}</div>
                </div>
                <div class="exchange-col">
                  <span class="exchange-label">${s.team_b.team_name} provides to ${s.team_a.team_name}:</span>
                  <div class="skill-pills-row">${skillsBProvides || '<span style="font-size:12px; color:var(--text-light);">Complementary Skills</span>'}</div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <div style="font-size: 12px; color: var(--text-light);">
                  Target Team Admin: <strong>${s.team_b.creator_name}</strong> (${s.team_b.member_count} Member${s.team_b.member_count > 1 ? 's' : ''})
                </div>
                ${actionBtnHtml}
              </div>
            </div>
          `;
        }).join('');

        document.querySelectorAll('.btn-open-merge-modal').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const slotId = parseInt(e.currentTarget.dataset.slotId);
            const studentId = parseInt(e.currentTarget.dataset.studentId);
            const teamBName = e.currentTarget.dataset.teamBName;
            
            if (slotId && studentId) {
              openSendInviteModal(slotId, studentId, `Team Merge with ${teamBName}`);
            } else if (slotId) {
              openSendRequestModal(slotId, `Team Merge with ${teamBName}`);
            }
          });
        });

      } else {
        teamMergeSection.classList.add('hidden');
      }
    } catch (err) {
      console.warn('Could not fetch team merge suggestions:', err);
      teamMergeSection.classList.add('hidden');
    }
  }

  // ------------------------------------------------------------
  // MULTI-SELECT FILTER HELPERS & DROPDOWNS
  // ------------------------------------------------------------
  function populateSkillFilterDropdown() {
    const listElem = document.getElementById('skillCheckboxList');
    const sortedSkills = [...state.skillsTaxonomy].sort((a, b) =>
      a.skill_name.localeCompare(b.skill_name, undefined, { sensitivity: 'base' })
    );

    listElem.innerHTML = sortedSkills.map(sk => `
      <label class="checkbox-option skill-checkbox-option" data-name="${escapeHtml(sk.skill_name).toLowerCase()}">
        <input type="checkbox" class="skill-checkbox" value="${escapeHtml(sk.skill_name)}">
        <span style="font-weight: 500;">${escapeHtml(sk.skill_name)}</span> <span style="font-size:10px; color: var(--text-light); margin-left: auto;">(${escapeHtml(sk.category_name)})</span>
      </label>
    `).join('');

    document.querySelectorAll('.skill-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        updateSkillDropdownLabel();
        triggerFilterSearch();
      });
    });
  }

  function getSelectedBranches() {
    return Array.from(document.querySelectorAll('.branch-checkbox:checked')).map(cb => cb.value);
  }

  function getSelectedSemesters() {
    return Array.from(document.querySelectorAll('.sem-checkbox:checked')).map(cb => parseInt(cb.value));
  }

  function getSelectedSkills() {
    return Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value);
  }

  function updateBranchDropdownLabel() {
    const selected = getSelectedBranches();
    const labelElem = document.getElementById('branchDropdownLabel');
    if (!labelElem) return;
    if (selected.length === 0) labelElem.textContent = 'All Branches';
    else if (selected.length === 1) labelElem.textContent = selected[0];
    else labelElem.textContent = `${selected.length} Branches Selected`;
  }

  function updateSemesterDropdownLabel() {
    const selected = getSelectedSemesters();
    const labelElem = document.getElementById('semesterDropdownLabel');
    if (!labelElem) return;
    if (selected.length === 0) labelElem.textContent = 'All Semesters (1st-8th)';
    else if (selected.length === 1) labelElem.textContent = `Sem ${selected[0]}`;
    else labelElem.textContent = `${selected.length} Semesters Selected`;
  }

  function updateSkillDropdownLabel() {
    const selected = getSelectedSkills();
    const labelElem = document.getElementById('skillDropdownLabel');
    if (!labelElem) return;
    if (selected.length === 0) labelElem.textContent = 'All Skills';
    else if (selected.length === 1) labelElem.textContent = selected[0];
    else labelElem.textContent = `${selected.length} Skills Selected`;
  }

  function triggerFilterSearch() {
    if (state.currentView === 'search-teams') loadDashboard();
    else if (state.currentView === 'search-students') loadCandidateSearchFeed();
  }

  function setupMultiSelectDropdowns() {
    const btnBranch = document.getElementById('btnBranchDropdown');
    const menuBranch = document.getElementById('menuBranchDropdown');
    const btnSem = document.getElementById('btnSemesterDropdown');
    const menuSem = document.getElementById('menuSemesterDropdown');
    const btnSkill = document.getElementById('btnSkillDropdown');
    const menuSkill = document.getElementById('menuSkillDropdown');

    const closeAllDropdowns = () => {
      if (menuBranch) menuBranch.classList.add('hidden');
      if (menuSem) menuSem.classList.add('hidden');
      if (menuSkill) menuSkill.classList.add('hidden');
      document.querySelectorAll('.slot-skills-dropdown-menu').forEach(m => m.classList.add('hidden'));
    };

    if (btnBranch && menuBranch) {
      btnBranch.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menuBranch.classList.contains('hidden');
        closeAllDropdowns();
        if (isHidden) menuBranch.classList.remove('hidden');
      });
      menuBranch.addEventListener('click', (e) => e.stopPropagation());
    }

    if (btnSem && menuSem) {
      btnSem.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menuSem.classList.contains('hidden');
        closeAllDropdowns();
        if (isHidden) menuSem.classList.remove('hidden');
      });
      menuSem.addEventListener('click', (e) => e.stopPropagation());
    }

    if (btnSkill && menuSkill) {
      btnSkill.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menuSkill.classList.contains('hidden');
        closeAllDropdowns();
        if (isHidden) menuSkill.classList.remove('hidden');
      });
      menuSkill.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('click', closeAllDropdowns);

    // Branch checkboxes
    document.querySelectorAll('.branch-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        updateBranchDropdownLabel();
        triggerFilterSearch();
      });
    });

    // Semester checkboxes
    document.querySelectorAll('.sem-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        updateSemesterDropdownLabel();
        triggerFilterSearch();
      });
    });

    // Clear buttons
    const btnClearBranches = document.getElementById('btnClearBranches');
    if (btnClearBranches) {
      btnClearBranches.addEventListener('click', () => {
        document.querySelectorAll('.branch-checkbox').forEach(cb => cb.checked = false);
        updateBranchDropdownLabel();
        triggerFilterSearch();
      });
    }

    const btnClearSemesters = document.getElementById('btnClearSemesters');
    if (btnClearSemesters) {
      btnClearSemesters.addEventListener('click', () => {
        document.querySelectorAll('.sem-checkbox').forEach(cb => cb.checked = false);
        updateSemesterDropdownLabel();
        triggerFilterSearch();
      });
    }

    const btnClearSkills = document.getElementById('btnClearSkills');
    if (btnClearSkills) {
      btnClearSkills.addEventListener('click', () => {
        document.querySelectorAll('.skill-checkbox').forEach(cb => cb.checked = false);
        updateSkillDropdownLabel();
        triggerFilterSearch();
      });
    }

    // Quick filter search inside skill dropdown
    const skillSearchInput = document.getElementById('skillSearchInput');
    if (skillSearchInput) {
      skillSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.skill-checkbox-option').forEach(opt => {
          const name = opt.dataset.name || '';
          if (!query || name.includes(query)) {
            opt.style.display = 'flex';
          } else {
            opt.style.display = 'none';
          }
        });
      });
    }

    // Search and Reset buttons in filter bar
    const btnSearchSubmit = document.getElementById('btnSearchSubmit');
    if (btnSearchSubmit) {
      btnSearchSubmit.addEventListener('click', () => {
        triggerFilterSearch();
      });
    }

    const btnSearchReset = document.getElementById('btnSearchReset');
    if (btnSearchReset) {
      btnSearchReset.addEventListener('click', () => {
        document.querySelectorAll('.branch-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.sem-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.skill-checkbox').forEach(cb => cb.checked = false);
        updateBranchDropdownLabel();
        updateSemesterDropdownLabel();
        updateSkillDropdownLabel();
        triggerFilterSearch();
      });
    }
  }

  async function loadDashboard() {
    if (!state.activeStudent) return;

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    teamsFeedList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-sub);"><i class="ti ti-loader animate-spin" style="font-size: 24px;"></i><p style="margin-top:8px;">Executing Search...</p></div>';
    feedTitleText.textContent = 'Teams looking for members';

    const selectedBranches = getSelectedBranches();
    const selectedSemesters = getSelectedSemesters();
    const selectedSkills = getSelectedSkills();

    const url = `/api/search/slots-for-student?student_id=${state.activeStudent.student_id}&match_mode=all`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      let slots = data.data || [];

      // Helper function for flexible branch matching
      const matchesBranch = (targetBranch, selectedList) => {
        if (!targetBranch) return false;
        const tb = targetBranch.toLowerCase();
        return selectedList.some(sel => {
          const sb = sel.toLowerCase();
          return tb.includes(sb) || sb.includes(tb);
        });
      };

      // 1. Branch Multi-select Filter
      if (selectedBranches.length > 0) {
        slots = slots.filter(s => 
          matchesBranch(s.branch, selectedBranches) ||
          matchesBranch(s.creator_branch, selectedBranches)
        );
      }

      // 2. Semester Multi-select Filter (1st to 8th)
      if (selectedSemesters.length > 0) {
        slots = slots.filter(s => {
          const sem = parseInt(s.semester || s.creator_semester || 5);
          return selectedSemesters.includes(sem);
        });
      }

      // 3. Built-in Skills Multi-select Filter
      if (selectedSkills.length > 0) {
        slots = slots.filter(s => 
          s.required_skills && s.required_skills.some(sk => 
            selectedSkills.some(sel => sel.toLowerCase() === sk.skill_name.toLowerCase())
          )
        );
      }

      feedOpenSlotsBadge.textContent = `${slots.length} Open Slots`;

      if (slots.length === 0) {
        teamsFeedList.innerHTML = `
          <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
            <i class="ti ti-search-off" style="font-size: 32px;"></i>
            <p style="margin-top: 8px; font-weight: 600;">No open slots match your selected multi-filter criteria.</p>
            <p style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Try checking different branches, semesters (1st-8th), or built-in skills.</p>
          </div>
        `;
        return;
      }

      teamsFeedList.innerHTML = slots.map((slot, index) => {
        const initials = getInitials(slot.team_name);
        const avatarAccentClass = index % 2 === 1 ? 'accent-rust' : '';
        const reqSkillsHtml = slot.required_skills.map(sk => 
          `<span class="skill-pill">${sk.skill_name}</span>`
        ).join('');

        const memberCount = slot.team_members ? slot.team_members.length : 1;
        const branchDisplay = slot.branch || 'COE';
        const semDisplay = slot.semester ? `${slot.semester}th` : '5th';

        const req = slot.connection_request;
        let actionBtnHtml = '';

        if (!req) {
          actionBtnHtml = `<button class="btn-request btn-open-request-modal" data-slot-id="${slot.slot_id}" data-team-name="${escapeHtml(slot.team_name)}"><i class="ti ti-send"></i> Send Request</button>`;
        } else if (req.status === 'pending') {
          actionBtnHtml = `<button class="btn-request pending"><i class="ti ti-clock"></i> Request Pending</button>`;
        } else if (req.status === 'accepted') {
          actionBtnHtml = `<button class="btn-request accepted btn-view-contact" data-slot-id="${slot.slot_id}" data-team-name="${escapeHtml(slot.team_name)}"><i class="ti ti-check"></i> Connected (View Contact)</button>`;
        } else {
          actionBtnHtml = `<button class="btn-request btn-open-request-modal" data-slot-id="${slot.slot_id}" data-team-name="${escapeHtml(slot.team_name)}"><i class="ti ti-refresh"></i> Send Request</button>`;
        }

        return `
          <div class="team-feed-card">
            <div class="card-team-info">
              <div class="team-avatar-box ${avatarAccentClass}">${initials}</div>
              <div class="team-details-text">
                <h4>${slot.team_name}</h4>
                <p>${slot.course_code ? slot.course_code + ' Course Project' : 'Course Project'}</p>
                <div class="post-time">Posted by ${slot.creator_name}</div>
              </div>
            </div>

            <div class="card-slot-info">
              <div class="slot-role-header">
                <span style="font-size: 11px; color: var(--text-light); font-weight: 700; text-transform: uppercase;">Open Slot</span>
                <span class="slot-member-count">${memberCount} Member${memberCount > 1 ? 's' : ''} •</span>
              </div>
              <div class="slot-role-name">Role: Open Slot #${slot.slot_id}</div>
              <div class="skill-pills-row">${reqSkillsHtml}</div>
            </div>

            <div class="card-meta-action">
              <div class="meta-branch-sem">
                <span class="meta-label">Branch</span>
                <span class="meta-val">${branchDisplay}</span>
              </div>
              <div class="meta-branch-sem">
                <span class="meta-label">Semester</span>
                <span class="meta-val">${semDisplay}</span>
              </div>
              ${actionBtnHtml}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.btn-open-request-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sId = parseInt(e.currentTarget.dataset.slotId);
          const tName = e.currentTarget.dataset.teamName;
          openSendRequestModal(sId, tName);
        });
      });

      document.querySelectorAll('.btn-view-contact').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sId = parseInt(e.currentTarget.dataset.slotId);
          const tName = e.currentTarget.dataset.teamName;
          const req = state.requests.outgoing.find(r => r.slot_id === sId && r.status === 'accepted');
          if (req) {
            openContactInfoModal({
              title: `Connected with ${tName}`,
              name: req.team_creator_name,
              email: req.team_creator_email,
              contact_info: req.team_creator_contact,
              role_info: `Team Creator (${tName})`
            });
          }
        });
      });

    } catch (err) {
      teamsFeedList.innerHTML = `<div style="padding: 20px; color: red;">Error: ${err.message}</div>`;
    }
  }

  // ------------------------------------------------------------
  // CANDIDATE SEARCH FEED
  // ------------------------------------------------------------
  async function loadCandidateSearchFeed() {
    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    const selectedBranches = getSelectedBranches();
    const selectedSemesters = getSelectedSemesters();
    const selectedSkills = getSelectedSkills();

    feedTitleText.textContent = 'Eligible candidates';

    let openSlots = [];
    state.teams.forEach(t => {
      t.slots.forEach(s => {
        if (s.slot_status === 'open') {
          openSlots.push({ ...s, team_name: t.team_name, course_code: t.course_code });
        }
      });
    });

    if (openSlots.length === 0) {
      teamsFeedList.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
          <i class="ti ti-search-off" style="font-size: 32px;"></i>
          <p style="margin-top:8px; font-weight:600;">No open slots match your current criteria.</p>
        </div>
      `;
      feedOpenSlotsBadge.textContent = '0 Candidates';
      return;
    }

    const firstSlot = openSlots[0];
    
    try {
      const url = `/api/search/students-for-slot?slot_id=${firstSlot.slot_id}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      let candidates = data.candidates || [];

      if (selectedBranches.length > 0) {
        candidates = candidates.filter(c => selectedBranches.some(b => c.branch && c.branch.toLowerCase().includes(b.toLowerCase())));
      }
      if (selectedSemesters.length > 0) {
        candidates = candidates.filter(c => selectedSemesters.includes(parseInt(c.semester)));
      }
      if (selectedSkills.length > 0) {
        candidates = candidates.filter(c => c.skills && c.skills.some(sk => selectedSkills.some(sel => sel.toLowerCase() === sk.skill_name.toLowerCase())));
      }

      feedOpenSlotsBadge.textContent = `${candidates.length} Candidate${candidates.length !== 1 ? 's' : ''}`;

      if (candidates.length === 0) {
        teamsFeedList.innerHTML = `
          <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
            <i class="ti ti-users-minus" style="font-size: 32px;"></i>
            <p style="margin-top:8px; font-weight:700;">No candidates match your selected filters for Slot #${firstSlot.slot_id} (${escapeHtml(firstSlot.team_name)}).</p>
            <p style="font-size: 12px; color: var(--text-light); margin-top: 4px;">Try clearing or adjusting your Branch, Semester, or Skill filter.</p>
          </div>
        `;
        return;
      }

      teamsFeedList.innerHTML = candidates.map(cand => {
        const initials = getInitials(cand.name);
        const candSkillsHtml = cand.skills.map(sk => `
          <span class="skill-pill">
            ${escapeHtml(sk.skill_name)}
            ${sk.credential_url ? `<a href="${formatProfileUrl(sk.credential_url, 'general')}" target="_blank" rel="noopener" class="skill-cred-link" title="Verify Certificate / Proof"><i class="ti ti-certificate"></i> Proof</a>` : ''}
          </span>
        `).join('');
        const req = cand.connection_request;

        let actionBtnHtml = '';
        if (!req) {
          actionBtnHtml = `<button class="btn-request btn-send-invite" data-slot-id="${firstSlot.slot_id}" data-student-id="${cand.student_id}" data-student-name="${escapeHtml(cand.name)}"><i class="ti ti-send"></i> Send Invite</button>`;
        } else if (req.status === 'pending') {
          actionBtnHtml = `<button class="btn-request pending"><i class="ti ti-clock"></i> Invited (Pending)</button>`;
        } else if (req.status === 'accepted') {
          actionBtnHtml = `<button class="btn-request accepted"><i class="ti ti-check"></i> Connected</button>`;
        } else {
          actionBtnHtml = `<button class="btn-request btn-send-invite" data-slot-id="${firstSlot.slot_id}" data-student-id="${cand.student_id}" data-student-name="${escapeHtml(cand.name)}"><i class="ti ti-refresh"></i> Send Invite</button>`;
        }

        return `
          <div class="team-feed-card">
            <div class="card-team-info">
              <div class="avatar-circle" style="width: 44px; height: 44px; font-size: 16px;">${initials}</div>
              <div class="team-details-text">
                <h4>${escapeHtml(cand.name)}</h4>
                <p>Roll: ${escapeHtml(cand.roll_no)}</p>
                ${renderCredentialBadges(cand)}
              </div>
            </div>

            <div class="card-slot-info">
              <div class="slot-role-header">
                <span class="slot-member-count">Targeting Slot #${firstSlot.slot_id} (${escapeHtml(firstSlot.team_name)})</span>
              </div>
              <div class="skill-pills-row">${candSkillsHtml}</div>
            </div>

            <div class="card-meta-action">
              <div class="meta-branch-sem">
                <span class="meta-label">Branch</span>
                <span class="meta-val">${escapeHtml(cand.branch)}</span>
              </div>
              <div class="meta-branch-sem">
                <span class="meta-label">Semester</span>
                <span class="meta-val">${cand.semester}th</span>
              </div>
              ${actionBtnHtml}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.btn-send-invite').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sId = parseInt(e.currentTarget.dataset.slotId);
          const stId = parseInt(e.currentTarget.dataset.studentId);
          const stName = e.currentTarget.dataset.studentName;
          openSendInviteModal(sId, stId, stName);
        });
      });

    } catch (err) {
      teamsFeedList.innerHTML = `<div style="padding: 20px; color: red;">Error: ${err.message}</div>`;
    }
  }

  // ------------------------------------------------------------
  // DEDICATED TEAM MERGES TAB FEED
  // ------------------------------------------------------------
  async function showTeamMergesFeed() {
    feedTitleText.textContent = 'Team Merge Suggestions';
    feedOpenSlotsBadge.textContent = 'Complementary Skill Merges';

    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    if (!state.activeStudent) {
      teamsFeedList.innerHTML = '<div style="padding: 40px; text-align: center;">Please sign in to view team merge suggestions.</div>';
      return;
    }

    teamsFeedList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-sub);"><i class="ti ti-loader animate-spin" style="font-size: 24px;"></i><p style="margin-top:8px;">Finding complementary team merges...</p></div>';

    try {
      const res = await fetch(`/api/search/team-merges?student_id=${state.activeStudent.student_id}`);
      const data = await res.json();

      if (!data.success || !data.suggestions || data.suggestions.length === 0) {
        teamsFeedList.innerHTML = `
          <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 48px 24px; text-align: center; color: var(--text-sub);">
            <i class="ti ti-git-merge" style="font-size: 40px; color: var(--accent-rust); margin-bottom: 12px; display: inline-block;"></i>
            <h4 style="font-family: var(--font-manrope); font-size: 18px; font-weight: 700; color: var(--text-dark); margin-bottom: 6px;">No complementary teams found right now</h4>
            <p style="font-size: 13.5px; color: var(--text-sub); max-width: 480px; margin: 0 auto 16px auto; line-height: 1.5;">Check back as more teams post their skill gaps or create open slots in your team!</p>
            <button class="btn-search" onclick="switchToTab('search-teams')" style="border-radius: 20px; font-size: 13px; padding: 8px 20px;">
              <i class="ti ti-search"></i> Browse Open Teams
            </button>
          </div>
        `;
        return;
      }

      teamsFeedList.innerHTML = data.suggestions.map(s => {
        const badgeClass = s.is_exact_match ? 'exact' : 'partial';
        const badgeLabel = s.is_exact_match ? '100% Exact Complementary Merge' : `Partial Merge (${s.match_percentage}%)`;

        const skillsAProvides = s.skills_a_provides_to_b.map(sk => `<span class="skill-pill">${sk.skill_name}</span>`).join('');
        const skillsBProvides = s.skills_b_provides_to_a.map(sk => `<span class="skill-pill">${sk.skill_name}</span>`).join('');

        const req = s.connection_request;
        let actionBtnHtml = '';

        const slotId = s.team_b.target_slot_id || s.team_a.target_slot_id || '';
        const studentId = s.team_b.target_student_id || '';

        if (!req) {
          actionBtnHtml = `<button class="btn-request btn-open-merge-modal" data-slot-id="${slotId}" data-student-id="${studentId}" data-team-b-name="${escapeHtml(s.team_b.team_name)}"><i class="ti ti-git-merge"></i> Request Team Merge</button>`;
        } else if (req.status === 'pending') {
          actionBtnHtml = `<button class="btn-request pending"><i class="ti ti-clock"></i> Merge Request Pending</button>`;
        } else if (req.status === 'accepted') {
          actionBtnHtml = `<button class="btn-request accepted btn-view-contact"><i class="ti ti-check"></i> Merged / Connected</button>`;
        } else {
          actionBtnHtml = `<button class="btn-request btn-open-merge-modal" data-slot-id="${slotId}" data-student-id="${studentId}" data-team-b-name="${escapeHtml(s.team_b.team_name)}"><i class="ti ti-refresh"></i> Request Team Merge</button>`;
        }

        return `
          <div class="team-merge-card" style="margin-bottom: 16px;">
            <div class="merge-header">
              <div class="merge-teams-title">
                <span>${s.team_a.team_name}</span>
                <i class="ti ti-arrows-exchange" style="color: var(--accent-rust); font-size: 18px;"></i>
                <span>${s.team_b.team_name}</span>
              </div>
              <span class="merge-match-badge ${badgeClass}">${badgeLabel}</span>
            </div>

            <div style="font-size: 12.5px; color: var(--text-sub); margin-bottom: 10px;">
              These two teams have complementary skill profiles. Instead of searching individually, both teams can combine forces!
            </div>

            <div class="skills-exchange-grid">
              <div class="exchange-col">
                <span class="exchange-label">${s.team_a.team_name} provides to ${s.team_b.team_name}:</span>
                <div class="skill-pills-row">${skillsAProvides || '<span style="font-size:12px; color:var(--text-light);">Complementary Skills</span>'}</div>
              </div>
              <div class="exchange-col">
                <span class="exchange-label">${s.team_b.team_name} provides to ${s.team_a.team_name}:</span>
                <div class="skill-pills-row">${skillsBProvides || '<span style="font-size:12px; color:var(--text-light);">Complementary Skills</span>'}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <div style="font-size: 12px; color: var(--text-light);">
                Target Team Admin: <strong>${s.team_b.creator_name}</strong> (${s.team_b.member_count} Member${s.team_b.member_count > 1 ? 's' : ''})
              </div>
              ${actionBtnHtml}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.btn-open-merge-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slotId = parseInt(e.currentTarget.dataset.slotId);
          const studentId = parseInt(e.currentTarget.dataset.studentId);
          const teamBName = e.currentTarget.dataset.teamBName;
          
          if (!isNaN(slotId) && slotId > 0 && !isNaN(studentId) && studentId > 0) {
            openSendInviteModal(slotId, studentId, `Team Merge with ${teamBName}`);
          } else if (!isNaN(slotId) && slotId > 0) {
            openSendRequestModal(slotId, `Team Merge with ${teamBName}`);
          } else {
            showToast(`To request a team merge with ${teamBName}, open a slot in your team or ask ${teamBName} to create an open slot.`, 'info');
          }
        });
      });

    } catch (err) {
      teamsFeedList.innerHTML = `<div style="padding: 20px; color: red;">Error loading team merge suggestions: ${err.message}</div>`;
    }
  }

  const viewStudentModal = document.getElementById('viewStudentModal');
  const btnCloseViewStudentModal = document.getElementById('btnCloseViewStudentModal');
  const viewStudentModalContent = document.getElementById('viewStudentModalContent');
  if (btnCloseViewStudentModal) {
    btnCloseViewStudentModal.addEventListener('click', () => viewStudentModal.classList.add('hidden'));
  }
  if (viewStudentModal) {
    viewStudentModal.addEventListener('click', (e) => {
      if (e.target === viewStudentModal) {
        viewStudentModal.classList.add('hidden');
      }
    });
  }

  async function fetchAndOpenStudentModal(studentId) {
    if (!studentId) return;

    try {
      const requesterParam = state.activeStudent ? `?requester_id=${state.activeStudent.student_id}` : '';
      const res = await fetch(`/api/students/${studentId}${requesterParam}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const st = data.data;
      const initials = getInitials(st.name);

      const isSelf = state.activeStudent && state.activeStudent.student_id === st.student_id;
      const isContactMasked = !isSelf && (!st.contact_info || st.contact_info.includes('[Hidden'));
      const isEmailMasked = !isSelf && (!st.email || st.email.includes('[Hidden'));

      const emailDisplayHtml = isEmailMasked
        ? `<div style="font-size: 12px; color: var(--text-light); font-weight: 600; margin-top: 2px;"><i class="ti ti-lock"></i> Email hidden until request accepted</div>`
        : `<div style="font-size: 13px; color: var(--accent-rust); font-weight: 600; margin-top: 2px;"><i class="ti ti-mail"></i> ${escapeHtml(st.email)}</div>`;

      const contactDisplayHtml = isContactMasked
        ? `<div style="font-size: 12.5px; font-weight: 600; color: var(--text-sub); margin-top: 2px;"><i class="ti ti-shield-lock" style="color: var(--accent-rust);"></i> Contact info hidden until connection request accepted</div>`
        : `<div style="font-size: 13.5px; font-weight: 700; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.contact_info)}</div>`;

      const skillsHtml = (st.skills && st.skills.length > 0)
        ? st.skills.map(sk => `
            <span class="skill-pill" style="font-size: 12px; padding: 4px 9px;">
              ${escapeHtml(sk.skill_name)} (${sk.proficiency || 'intermediate'})
              ${sk.credential_url ? `<a href="${formatProfileUrl(sk.credential_url, 'general')}" target="_blank" rel="noopener" class="skill-cred-link" title="Verify Certificate / Proof"><i class="ti ti-certificate"></i> Proof</a>` : ''}
            </span>
          `).join('')
        : '<span style="font-size: 12.5px; color: var(--text-sub);">No skills listed.</span>';

      viewStudentModalContent.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 14px; margin-bottom: 14px;">
          <div class="avatar-circle" style="width: 50px; height: 50px; font-size: 20px;">${initials}</div>
          <div>
            <h4 style="font-family: var(--font-manrope); font-size: 20px; font-weight: 700; color: var(--text-dark);">${escapeHtml(st.name)}</h4>
            ${emailDisplayHtml}
            ${renderCredentialBadges(st)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div style="background: #faf9f6; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-size: 10.5px; color: var(--text-sub); text-transform: uppercase; font-weight: 700;">Roll Number</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.roll_no)}</div>
          </div>
          <div style="background: #faf9f6; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-size: 10.5px; color: var(--text-sub); text-transform: uppercase; font-weight: 700;">Branch & Semester</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin-top: 2px;">${escapeHtml(st.branch)} • Sem ${st.semester}</div>
          </div>
        </div>

        <div style="background: #faf9f6; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--card-border); margin-bottom: 16px;">
          <div style="font-size: 10.5px; color: var(--text-sub); text-transform: uppercase; font-weight: 700;">Contact Details</div>
          ${contactDisplayHtml}
        </div>

        <div style="border-top: 1px solid var(--card-border); padding-top: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-dark); text-transform: uppercase; margin-bottom: 8px;">Skills & Verified Credentials</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">${skillsHtml}</div>
        </div>
      `;

      viewStudentModal.classList.remove('hidden');
    } catch (err) {
      showToast('Error loading student profile: ' + err.message, 'error');
    }
  }

  // ------------------------------------------------------------
  // REQUESTS VIEW (Incoming & Outgoing Connection Requests)
  // ------------------------------------------------------------
  async function loadRequestsFeed() {
    const teamMergeSection = document.getElementById('teamMergeSection');
    if (teamMergeSection) teamMergeSection.classList.add('hidden');

    feedTitleText.textContent = 'Connection Requests & Invites';
    feedOpenSlotsBadge.textContent = 'Request-and-Accept Flow';

    await fetchStudentRequests();

    const incoming = state.requests.incoming || [];
    const outgoing = state.requests.outgoing || [];

    if (incoming.length === 0 && outgoing.length === 0) {
      teamsFeedList.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--text-sub);">
          <i class="ti ti-mail-opened" style="font-size: 36px; color: var(--text-light);"></i>
          <p style="margin-top: 10px; font-size: 16px; font-weight: 600;">No Connection Requests Yet</p>
          <p style="font-size: 13px; color: var(--text-light); margin-top: 4px;">When you send or receive requests for open slots, they will appear right here!</p>
        </div>
      `;
      return;
    }

    let html = '';

    if (incoming.length > 0) {
      html += `<h4 style="font-family: var(--font-manrope); font-size: 18px; margin-bottom: 12px; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="ti ti-inbox"></i> Incoming Requests (${incoming.length})</h4>`;

      html += incoming.map(req => {
        const reqSkills = req.slot_required_skills ? req.slot_required_skills.map(s => `<span class="skill-pill">${s}</span>`).join('') : '';
        const appSkills = req.applicant_skills ? req.applicant_skills.map(s => `<span class="skill-pill">${s}</span>`).join('') : '';

        let actionsHtml = '';
        if (req.status === 'pending') {
          actionsHtml = `
            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              <button class="btn-search btn-respond-request" data-request-id="${req.request_id}" data-action="accept" style="background: var(--badge-green-text); font-size: 13px; padding: 6px 14px;"><i class="ti ti-check"></i> Accept & Share Contact</button>
              <button class="btn-reset btn-respond-request" data-request-id="${req.request_id}" data-action="decline" style="font-size: 13px; padding: 6px 14px; color: var(--badge-red-text); border-color: #fca5a5;"><i class="ti ti-x"></i> Decline</button>
              <button class="btn-reset btn-view-student-profile" data-student-id="${req.student_id}" style="font-size: 13px; padding: 6px 14px;"><i class="ti ti-id"></i> View Full Profile</button>
            </div>
          `;
        } else if (req.status === 'accepted') {
          const isAdded = req.is_added_to_team > 0;
          actionsHtml = `
            <div class="contact-unlocked-box">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h6><i class="ti ti-lock-open"></i> Contact Details Unlocked</h6>
                <button class="btn-reset btn-view-student-profile" data-student-id="${req.student_id}" style="font-size: 12px; padding: 3px 10px;"><i class="ti ti-id"></i> View Full Profile</button>
              </div>
              <p><strong>Email:</strong> ${req.applicant_email}</p>
              <p><strong>Contact:</strong> ${escapeHtml(req.applicant_contact)}</p>
              ${isAdded ? `
                <div style="margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--badge-green-text); background: #dcfce7; padding: 6px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="ti ti-circle-check"></i> Added to Team Roster (${escapeHtml(req.team_name)})
                </div>
              ` : `
                <div style="margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 12px; color: var(--text-sub);">Communicated & decided to add to team?</div>
                  <button class="btn-search btn-add-to-team" data-request-id="${req.request_id}" data-applicant-name="${escapeHtml(req.applicant_name)}" data-team-name="${escapeHtml(req.team_name)}" style="font-size: 12.5px; padding: 6px 14px; background: var(--accent-rust);">
                    <i class="ti ti-user-plus"></i> Add to Team
                  </button>
                </div>
              `}
            </div>
          `;
        }

        return `
          <div class="request-card">
            <div class="request-card-header">
              <div>
                <div class="request-title" style="display: flex; align-items: center; gap: 8px;">
                  <span style="cursor: pointer; font-weight: 700; color: var(--text-dark);" class="btn-view-student-profile" data-student-id="${req.student_id}">${escapeHtml(req.applicant_name)} (${req.applicant_branch} Sem ${req.applicant_semester})</span>
                </div>
                <div style="font-size: 12px; color: var(--text-sub); margin-top: 2px;">Requested for <strong>${escapeHtml(req.team_name)}</strong> • Slot #${req.slot_id}</div>
              </div>
              <span class="status-badge ${req.status}">${req.status}</span>
            </div>

            ${req.message ? `<div style="font-size: 13px; color: var(--text-dark); background: #faf9f6; padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--accent-rust);">"${escapeHtml(req.message)}"</div>` : ''}

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 11px; color: var(--text-light); font-weight: 700; text-transform: uppercase;">Required Slot Skills</div>
              <div class="skill-pills-row">${reqSkills}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 11px; color: var(--text-light); font-weight: 700; text-transform: uppercase;">Applicant Skills</div>
              <div class="skill-pills-row">${appSkills}</div>
            </div>

            ${actionsHtml}
          </div>
        `;
      }).join('');
    }

    if (outgoing.length > 0) {
      html += `<h4 style="font-family: var(--font-manrope); font-size: 18px; margin: 24px 0 12px 0; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="ti ti-send"></i> Sent Requests (${outgoing.length})</h4>`;

      html += outgoing.map(req => {
        const reqSkills = req.slot_required_skills ? req.slot_required_skills.map(s => `<span class="skill-pill">${s}</span>`).join('') : '';

        let contactHtml = '';
        if (req.status === 'accepted') {
          contactHtml = `
            <div class="contact-unlocked-box">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h6><i class="ti ti-lock-open"></i> Team Creator Contact Details Unlocked</h6>
                ${req.team_creator_id ? `<button class="btn-reset btn-view-student-profile" data-student-id="${req.team_creator_id}" style="font-size: 12px; padding: 3px 10px;"><i class="ti ti-id"></i> View Creator Profile</button>` : ''}
              </div>
              <p><strong>Name:</strong> ${escapeHtml(req.team_creator_name)}</p>
              <p><strong>Email:</strong> ${req.team_creator_email}</p>
              <p><strong>Contact:</strong> ${escapeHtml(req.team_creator_contact)}</p>
              ${req.is_added_to_team > 0 ? `
                <div style="margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--badge-green-text); background: #dcfce7; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="ti ti-check"></i> Added to Team Roster
                </div>
              ` : `
                <div style="margin-top: 8px; font-size: 12px; color: var(--text-sub);">
                  <i class="ti ti-info-circle"></i> Contact unlocked. Communicate with team lead to finalize team onboarding.
                </div>
              `}
            </div>
          `;
        }

        return `
          <div class="request-card">
            <div class="request-card-header">
              <div>
                <div class="request-title" style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 700; color: var(--text-dark);">${escapeHtml(req.team_name)}</span>
                  ${req.team_creator_id ? `<button class="btn-reset btn-view-student-profile" data-student-id="${req.team_creator_id}" style="font-size: 11.5px; padding: 2px 8px; font-weight: 600;"><i class="ti ti-user"></i> ${escapeHtml(req.team_creator_name)}</button>` : ''}
                </div>
                <div style="font-size: 12px; color: var(--text-sub); margin-top: 2px;">Slot #${req.slot_id} ${req.course_code ? '• ' + req.course_code : ''}</div>
              </div>
              <span class="status-badge ${req.status}">${req.status}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 11px; color: var(--text-light); font-weight: 700; text-transform: uppercase;">Slot Required Skills</div>
              <div class="skill-pills-row">${reqSkills}</div>
            </div>

            ${req.message ? `<div style="font-size: 13px; color: var(--text-sub);">Your Note: "${escapeHtml(req.message)}"</div>` : ''}
            ${contactHtml}
          </div>
        `;
      }).join('');
    }

    teamsFeedList.innerHTML = html;

    document.querySelectorAll('.btn-respond-request').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rId = parseInt(e.currentTarget.dataset.requestId);
        const act = e.currentTarget.dataset.action;
        handleRespondRequest(rId, act);
      });
    });

    document.querySelectorAll('.btn-add-to-team').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const rId = parseInt(e.currentTarget.dataset.requestId);
        const appName = e.currentTarget.dataset.applicantName;
        const tName = e.currentTarget.dataset.teamName;
        
        const confirmed = confirm(
          `Add ${appName} to ${tName}?\n\nHave you communicated with ${appName} and decided to officially add them to your project team?`
        );

        if (!confirmed) return;

        try {
          const res = await fetch(`/api/requests/${rId}/add-to-team`, { method: 'POST' });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);

          showToast(data.message, 'success');
          await fetchMetadata();
          await updateActiveProfileUI();
          loadRequestsFeed();
        } catch (err) {
          showToast('Error adding team member: ' + err.message, 'error');
        }
      });
    });

    document.querySelectorAll('.btn-view-student-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stId = parseInt(e.currentTarget.dataset.studentId);
        fetchAndOpenStudentModal(stId);
      });
    });
  }

  // ------------------------------------------------------------
  // REQUEST ACTIONS & MODAL HANDLERS
  // ------------------------------------------------------------
  function openSendRequestModal(slotId, teamName) {
    if (!state.activeStudent) return;

    requestModalSlotId.value = slotId;
    requestModalStudentId.value = state.activeStudent.student_id;
    requestModalMessage.value = '';

    requestModalSlotDetails.innerHTML = `
      <div style="font-weight: 700; font-size: 15px; color: var(--text-dark);">${teamName}</div>
      <div style="font-size: 12px; color: var(--text-sub);">Target Slot #${slotId}</div>
    `;

    sendRequestModal.classList.remove('hidden');
  }

  function openSendInviteModal(slotId, targetStudentId, studentName) {
    requestModalSlotId.value = slotId;
    requestModalStudentId.value = targetStudentId;
    requestModalMessage.value = '';

    requestModalSlotDetails.innerHTML = `
      <div style="font-weight: 700; font-size: 15px; color: var(--text-dark);">Invite ${studentName}</div>
      <div style="font-size: 12px; color: var(--text-sub);">For Slot #${slotId}</div>
    `;

    sendRequestModal.classList.remove('hidden');
  }

  async function handleSendRequestSubmit(e) {
    e.preventDefault();

    const slotId = parseInt(requestModalSlotId.value);
    const studentId = parseInt(requestModalStudentId.value);
    const message = requestModalMessage.value.trim();

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slotId,
          student_id: studentId,
          sender_type: 'student',
          message
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Connection request sent successfully!', 'success');
      sendRequestModal.classList.add('hidden');

      await updateActiveProfileUI();
      if (state.currentView === 'search-teams') loadDashboard();
      else if (state.currentView === 'requests') loadRequestsFeed();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleRespondRequest(requestId, action) {
    try {
      const res = await fetch(`/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          responder_student_id: state.activeStudent.student_id
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (action === 'accept') {
        showToast('Request Accepted! Slot filled & contact unlocked.', 'success');
        if (data.contact_info) {
          openContactInfoModal({
            title: 'Request Accepted!',
            name: data.contact_info.name,
            email: data.contact_info.email,
            contact_info: data.contact_info.contact_info,
            role_info: 'Confirmed Teammate'
          });
        }
      } else {
        showToast('Request declined.', 'info');
      }

      await fetchMetadata();
      await updateActiveProfileUI();
      if (state.currentView === 'requests') loadRequestsFeed();
      else if (state.currentView === 'search-teams') loadDashboard();
    } catch (err) {
      showToast('Error responding: ' + err.message, 'error');
    }
  }

  function openContactInfoModal(info) {
    contactModalContent.innerHTML = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: 700; color: var(--badge-green-text); margin-bottom: 8px;">${info.title}</div>
        <p style="margin-bottom: 6px;"><strong>Name:</strong> ${info.name}</p>
        <p style="margin-bottom: 6px;"><strong>Email:</strong> <a href="mailto:${info.email}" style="color: var(--accent-rust); text-decoration: underline;">${info.email}</a></p>
        <p style="margin-bottom: 6px;"><strong>Contact Handles:</strong> ${info.contact_info}</p>
        <p style="font-size: 12px; color: var(--text-sub); margin-top: 8px;">Role: ${info.role_info}</p>
      </div>
      <button class="btn-search" onclick="document.getElementById('contactInfoModal').classList.add('hidden')" style="width: 100%; border-radius: 20px;">Close</button>
    `;
    contactInfoModal.classList.remove('hidden');
  }

  // ------------------------------------------------------------
  // DYNAMIC PROFILE COMPLETION WIDGET
  // ------------------------------------------------------------
  function updateProfileCompletionWidget() {
    const gaugeWrap = document.getElementById('dashCompletionGauge');
    const percentElem = document.getElementById('dashCompletionPercent');
    const titleElem = document.getElementById('dashCompletionTitle');
    const subElem = document.getElementById('dashCompletionSubtitle');
    const checklistGrid = document.getElementById('dashCompletionChecklist');

    if (!gaugeWrap || !percentElem || !checklistGrid) return;

    if (!state.activeStudent) {
      percentElem.textContent = '0%';
      gaugeWrap.style.background = 'conic-gradient(#e5e3de 0% 100%)';
      if (titleElem) titleElem.textContent = 'Sign In Required';
      if (subElem) subElem.textContent = 'Sign in to calculate your profile completion score.';
      checklistGrid.innerHTML = `
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Basic Information</div>
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Branch & Semester</div>
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Contact Details</div>
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Skills Added</div>
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Skill Credentials</div>
        <div class="check-item pending"><i class="ti ti-circle-dashed"></i> Dev / Social Links</div>
      `;
      return;
    }

    const st = state.activeStudent;

    const isBasicInfo = !!(st.name && st.email && st.roll_no);
    const isBranchSem = !!(st.branch && st.semester);
    const isContact = !!(st.contact_info && st.contact_info.trim() && !st.contact_info.includes('[Hidden'));
    const hasSkills = Array.isArray(st.skills) && st.skills.length > 0;
    const hasSkillProof = Array.isArray(st.skills) && st.skills.some(s => s.credential_url && s.credential_url.trim());
    const hasDevLinks = !!(st.linkedin_url || st.github_url || st.leetcode_url);

    let totalPercent = 0;
    if (isBasicInfo) totalPercent += 15;
    if (isBranchSem) totalPercent += 15;
    if (isContact) totalPercent += 15;
    if (hasSkills) totalPercent += 20;
    if (hasSkillProof) totalPercent += 15;
    if (hasDevLinks) totalPercent += 20;

    percentElem.textContent = `${totalPercent}%`;
    gaugeWrap.style.background = `conic-gradient(var(--accent-rust) 0% ${totalPercent}%, #e5e3de ${totalPercent}% 100%)`;

    if (titleElem && subElem) {
      if (totalPercent === 100) {
        titleElem.textContent = 'Profile 100% Complete! 🎉';
        subElem.textContent = 'Your profile is fully optimized and stands out to team creators!';
      } else if (totalPercent >= 70) {
        titleElem.textContent = 'Almost there!';
        subElem.textContent = 'Complete a few more steps to maximize your visibility.';
      } else if (totalPercent >= 40) {
        titleElem.textContent = 'Good progress!';
        subElem.textContent = 'Add your skills and social profiles to stand out.';
      } else {
        titleElem.textContent = 'Set up your profile';
        subElem.textContent = 'Complete your profile details to join teams easily.';
      }
    }

    checklistGrid.innerHTML = `
      <div class="check-item ${isBasicInfo ? 'done' : 'pending'}">
        <i class="ti ${isBasicInfo ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Basic Information
      </div>
      <div class="check-item ${isBranchSem ? 'done' : 'pending'}">
        <i class="ti ${isBranchSem ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Branch & Semester
      </div>
      <div class="check-item ${isContact ? 'done' : 'pending'}">
        <i class="ti ${isContact ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Contact Details
      </div>
      <div class="check-item ${hasSkills ? 'done' : 'pending'}">
        <i class="ti ${hasSkills ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Skills Added
      </div>
      <div class="check-item ${hasSkillProof ? 'done' : 'pending'}">
        <i class="ti ${hasSkillProof ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Skill Credentials
      </div>
      <div class="check-item ${hasDevLinks ? 'done' : 'pending'}">
        <i class="ti ${hasDevLinks ? 'ti-circle-check-filled' : 'ti-circle-dashed'}"></i> Dev / Social Links
      </div>
    `;
  }

  // ------------------------------------------------------------
  // RIGHT SIDEBAR WIDGETS RENDERING
  // ------------------------------------------------------------
  function renderRightWidgets() {
    updateProfileCompletionWidget();
    if (!state.activeStudent) return;

    if (state.activeStudent.skills) {
      widgetSkillPills.innerHTML = state.activeStudent.skills.map(sk => 
        `<span class="skill-pill">${sk.skill_name}</span>`
      ).join('');
    }

    const userTeams = state.teams.filter(t => 
      t.creator_id === state.activeStudent.student_id || 
      t.members.some(m => m.student_id === state.activeStudent.student_id)
    );

    const dashMetricTeamsJoined = document.getElementById('dashMetricTeamsJoined');
    if (dashMetricTeamsJoined) {
      dashMetricTeamsJoined.textContent = userTeams.length;
    }

    if (userTeams.length > 0) {
      widgetYourTeams.innerHTML = userTeams.map(t => {
        const initials = getInitials(t.team_name);
        const role = t.creator_id === state.activeStudent.student_id ? 'Admin' : 'Member';
        return `
          <div class="widget-team-item">
            <div class="widget-team-left">
              <div class="widget-avatar">${initials}</div>
              <div>
                <div class="widget-team-name">${t.team_name}</div>
                <div class="widget-team-sub">${t.course_code ? t.course_code + ' Project' : 'General Project'}</div>
              </div>
            </div>
            <span class="role-badge">${role}</span>
          </div>
        `;
      }).join('');
    } else {
      widgetYourTeams.innerHTML = '<div style="font-size:12px; color: var(--text-sub);">No teams joined yet.</div>';
    }

    const incoming = state.requests.incoming || [];
    const pendingIncoming = incoming.filter(r => r.status === 'pending');

    if (pendingIncoming.length > 0) {
      widgetRequestsSummary.innerHTML = `
        <div style="background: var(--badge-amber-bg); color: var(--badge-amber-text); padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;">
          <i class="ti ti-mail"></i> You have <strong>${pendingIncoming.length}</strong> pending request${pendingIncoming.length > 1 ? 's' : ''}!
        </div>
      `;
    } else {
      widgetRequestsSummary.innerHTML = `
        <div style="font-size: 12.5px; color: var(--text-sub);">No pending requests at this time.</div>
      `;
    }

    const targetTeam = userTeams[0] || state.teams[0];
    if (targetTeam && widgetSkillGapContent) {
      const missingCatIds = new Set((targetTeam.skill_gaps || []).map(g => g.category_id));

      const categoriesMap = new Map();
      if (state.skillsTaxonomy && state.skillsTaxonomy.length > 0) {
        state.skillsTaxonomy.forEach(s => {
          if (!categoriesMap.has(s.category_id)) {
            categoriesMap.set(s.category_id, s.category_name);
          }
        });
      }

      let itemsHtml = '';
      if (categoriesMap.size > 0) {
        categoriesMap.forEach((catName, catId) => {
          const isMissing = missingCatIds.has(catId);
          itemsHtml += `
            <div class="skill-gap-item">
              <span style="font-size: 11px; font-weight: 500;">${escapeHtml(catName)}</span>
              <span class="gap-status-pill ${isMissing ? 'missing' : 'covered'}">${isMissing ? 'Missing' : 'Covered'}</span>
            </div>
          `;
        });
      } else if (targetTeam.skill_gaps && targetTeam.skill_gaps.length > 0) {
        itemsHtml = targetTeam.skill_gaps.map(g => `
          <div class="skill-gap-item">
            <span style="font-size: 11px; font-weight: 500;">${escapeHtml(g.category_name)}</span>
            <span class="gap-status-pill missing">Missing</span>
          </div>
        `).join('');
      } else {
        itemsHtml = '<div style="font-size:12px; color: var(--badge-green-text); font-weight:600;"><i class="ti ti-check"></i> All skill categories covered!</div>';
      }

      widgetSkillGapContent.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px;">${escapeHtml(targetTeam.team_name)}</div>
        <div style="font-size: 10.5px; color: var(--text-sub); margin-bottom: 10px;">Relational GROUP BY Skill Gap Analysis</div>
        <div class="skill-gap-list" style="max-height: 220px; overflow-y: auto; padding-right: 4px;">
          ${itemsHtml}
        </div>
      `;
    }

    if (widgetPastCollabs) {
      if (!state.activeStudent) {
        widgetPastCollabs.innerHTML = `
          <div style="padding: 16px 8px; text-align: center; color: var(--text-sub); font-size: 12.5px;">
            Sign in to view past collaborations.
          </div>
        `;
      } else {
        fetch(`/api/students/${state.activeStudent.student_id}/collaborations`)
          .then(res => res.json())
          .then(data => {
            const collabs = (data.success && data.data) ? data.data : [];
            const dashMetricCollaborations = document.getElementById('dashMetricCollaborations');
            if (dashMetricCollaborations) dashMetricCollaborations.textContent = collabs.length;

            if (collabs.length > 0) {
              widgetPastCollabs.innerHTML = collabs.map(c => {
                const initials = c.partner_name ? c.partner_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'ST';
                return `
                  <div class="collab-item">
                    <div class="collab-left">
                      <div class="collab-avatar">${escapeHtml(initials)}</div>
                      <div>
                        <div class="collab-name">${escapeHtml(c.partner_name)}</div>
                        <div class="collab-project">${escapeHtml(c.project_name)}</div>
                      </div>
                    </div>
                    <span class="role-badge">Worked together</span>
                  </div>
                `;
              }).join('');
            } else {
              widgetPastCollabs.innerHTML = `
                <div style="padding: 16px 8px; text-align: center; color: var(--text-sub); font-size: 12.5px;">
                  <i class="ti ti-users" style="font-size: 22px; color: var(--text-light); margin-bottom: 4px; display: block;"></i>
                  No past collaborations recorded yet.
                </div>
              `;
            }
          })
          .catch(() => {
            widgetPastCollabs.innerHTML = `
              <div style="padding: 16px 8px; text-align: center; color: var(--text-sub); font-size: 12.5px;">
                No past collaborations recorded yet.
              </div>
            `;
          });
      }
    }
  }

  // ------------------------------------------------------------
  // CREATE TEAM MULTI-STEP WIZARD & SUMMARY PREVIEW LOGIC
  // ------------------------------------------------------------
  let wizardState = {
    step: 1,
    slots: [
      { id: 1, role_title: 'Backend Developer', count: 1, skill_ids: [], match_mode: 'exact' }
    ]
  };

  const btnOpenCreateTeamModal = document.getElementById('btnOpenCreateTeamModal');
  const btnNextToStep2 = document.getElementById('btnNextToStep2');
  const btnBackToStep1 = document.getElementById('btnBackToStep1');
  const btnAddSlotCard = document.getElementById('btnAddSlotCard');
  const createTeamStep1 = document.getElementById('createTeamStep1');
  const createTeamStep2 = document.getElementById('createTeamStep2');
  const stepIndicator1 = document.getElementById('stepIndicator1');
  const stepIndicator2 = document.getElementById('stepIndicator2');
  const stepperLine = document.getElementById('stepperLine');
  const slotsListContainer = document.getElementById('slotsListContainer');

  const newTeamDescription = document.getElementById('newTeamDescription');
  const newTeamProjectType = document.getElementById('newTeamProjectType');
  const newTeamMaxSize = document.getElementById('newTeamMaxSize');
  const newTeamDeadline = document.getElementById('newTeamDeadline');

  const teamNameCharCount = document.getElementById('teamNameCharCount');
  const teamDescCharCount = document.getElementById('teamDescCharCount');

  // Summary bar elements
  const sumTeamName = document.getElementById('sumTeamName');
  const sumProjectType = document.getElementById('sumProjectType');
  const sumTeamSize = document.getElementById('sumTeamSize');
  const sumDeadline = document.getElementById('sumDeadline');
  const sumSlotsDefined = document.getElementById('sumSlotsDefined');

  if (btnOpenCreateTeamModal) {
    btnOpenCreateTeamModal.addEventListener('click', openCreateTeamWizard);
  }

  const PREDEFINED_SKILLS_TAXONOMY_STATIC = [
    { skill_id: 1, skill_name: "MySQL", category_name: "Databases & Big Data" },
    { skill_id: 2, skill_name: "PostgreSQL", category_name: "Databases & Big Data" },
    { skill_id: 3, skill_name: "MongoDB", category_name: "Databases & Big Data" },
    { skill_id: 4, skill_name: "Redis", category_name: "Databases & Big Data" },
    { skill_id: 5, skill_name: "Python", category_name: "Machine Learning & AI" },
    { skill_id: 6, skill_name: "PyTorch", category_name: "Machine Learning & AI" },
    { skill_id: 7, skill_name: "TensorFlow", category_name: "Machine Learning & AI" },
    { skill_id: 8, skill_name: "Scikit-Learn", category_name: "Machine Learning & AI" },
    { skill_id: 9, skill_name: "React.js", category_name: "Web Development" },
    { skill_id: 10, skill_name: "Node.js", category_name: "Web Development" },
    { skill_id: 11, skill_name: "TypeScript", category_name: "Web Development" },
    { skill_id: 12, skill_name: "HTML/CSS/Tabler", category_name: "Web Development" },
    { skill_id: 13, skill_name: "Flutter", category_name: "Mobile Development" },
    { skill_id: 14, skill_name: "React Native", category_name: "Mobile Development" },
    { skill_id: 15, skill_name: "Kotlin", category_name: "Mobile Development" },
    { skill_id: 16, skill_name: "C++", category_name: "Systems & Core CS" },
    { skill_id: 17, skill_name: "Operating Systems", category_name: "Systems & Core CS" },
    { skill_id: 18, skill_name: "Docker", category_name: "Systems & Core CS" },
    { skill_id: 19, skill_name: "Frontend Development", category_name: "General Specializations" },
    { skill_id: 20, skill_name: "Backend Development", category_name: "General Specializations" },
    { skill_id: 21, skill_name: "Full Stack Development", category_name: "General Specializations" },
    { skill_id: 22, skill_name: "Cybersecurity", category_name: "General Specializations" },
    { skill_id: 23, skill_name: "Mobile Development", category_name: "General Specializations" },
    { skill_id: 24, skill_name: "DevOps", category_name: "General Specializations" },
    { skill_id: 25, skill_name: "Cloud Computing", category_name: "General Specializations" },
    { skill_id: 26, skill_name: "Data Science", category_name: "General Specializations" },
    { skill_id: 27, skill_name: "Artificial Intelligence", category_name: "General Specializations" },
    { skill_id: 28, skill_name: "Database Management", category_name: "General Specializations" },
    { skill_id: 29, skill_name: "Embedded Systems", category_name: "General Specializations" },
    { skill_id: 30, skill_name: "Game Development", category_name: "General Specializations" },
    { skill_id: 31, skill_name: "Blockchain", category_name: "General Specializations" },
    { skill_id: 33, skill_name: "JavaScript", category_name: "Software Engineering & Web" },
    { skill_id: 36, skill_name: "Java", category_name: "Software Engineering & Web" },
    { skill_id: 37, skill_name: "C#", category_name: "Software Engineering & Web" },
    { skill_id: 38, skill_name: "Go", category_name: "Software Engineering & Web" },
    { skill_id: 39, skill_name: "Rust", category_name: "Software Engineering & Web" },
    { skill_id: 42, skill_name: "Express.js", category_name: "Software Engineering & Web" },
    { skill_id: 43, skill_name: "Angular", category_name: "Software Engineering & Web" },
    { skill_id: 44, skill_name: "Vue.js", category_name: "Software Engineering & Web" },
    { skill_id: 45, skill_name: "Django", category_name: "Software Engineering & Web" },
    { skill_id: 46, skill_name: "Flask", category_name: "Software Engineering & Web" },
    { skill_id: 47, skill_name: "Spring Boot", category_name: "Software Engineering & Web" },
    { skill_id: 48, skill_name: "Next.js", category_name: "Software Engineering & Web" },
    { skill_id: 49, skill_name: "GraphQL", category_name: "Software Engineering & Web" },
    { skill_id: 50, skill_name: "REST API Architecture", category_name: "Software Engineering & Web" },
    { skill_id: 51, skill_name: "Microservices", category_name: "Software Engineering & Web" },
    { skill_id: 52, skill_name: "Machine Learning", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 53, skill_name: "Deep Learning", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 56, skill_name: "Computer Vision", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 57, skill_name: "Natural Language Processing (NLP)", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 58, skill_name: "Large Language Models (LLMs)", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 59, skill_name: "Pandas", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 60, skill_name: "NumPy", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 62, skill_name: "OpenCV", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 63, skill_name: "Reinforcement Learning", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 64, skill_name: "Data Mining", category_name: "Artificial Intelligence & Data Science" },
    { skill_id: 69, skill_name: "Apache Kafka", category_name: "Database Systems & Big Data" },
    { skill_id: 70, skill_name: "Neo4j", category_name: "Database Systems & Big Data" },
    { skill_id: 71, skill_name: "Snowflake", category_name: "Database Systems & Big Data" },
    { skill_id: 72, skill_name: "Apache Spark", category_name: "Database Systems & Big Data" },
    { skill_id: 73, skill_name: "Firebase", category_name: "Database Systems & Big Data" },
    { skill_id: 74, skill_name: "Cassandra", category_name: "Database Systems & Big Data" },
    { skill_id: 75, skill_name: "SQL Optimization", category_name: "Database Systems & Big Data" },
    { skill_id: 77, skill_name: "Kubernetes", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 78, skill_name: "AWS", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 79, skill_name: "Google Cloud Platform (GCP)", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 80, skill_name: "Azure", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 81, skill_name: "Terraform", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 82, skill_name: "CI/CD Pipelines", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 83, skill_name: "Linux System Admin", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 84, skill_name: "Nginx", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 85, skill_name: "Serverless Computing", category_name: "Cloud, DevOps & Infrastructure" },
    { skill_id: 88, skill_name: "Swift (iOS)", category_name: "Mobile Application Development" },
    { skill_id: 89, skill_name: "Kotlin (Android)", category_name: "Mobile Application Development" },
    { skill_id: 90, skill_name: "Android SDK", category_name: "Mobile Application Development" },
    { skill_id: 91, skill_name: "iOS Development", category_name: "Mobile Application Development" },
    { skill_id: 92, skill_name: "Figma", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 93, skill_name: "User Research", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 94, skill_name: "Wireframing & Prototyping", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 95, skill_name: "UI/UX Design", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 96, skill_name: "CSS3 / TailwindCSS", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 97, skill_name: "Web Accessibility (a11y)", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 98, skill_name: "Adobe XD", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 99, skill_name: "Responsive Web Design", category_name: "UI/UX Design & Frontend Architecture" },
    { skill_id: 100, skill_name: "Penetration Testing", category_name: "Cybersecurity & Networking" },
    { skill_id: 101, skill_name: "Ethical Hacking", category_name: "Cybersecurity & Networking" },
    { skill_id: 102, skill_name: "Cryptography", category_name: "Cybersecurity & Networking" },
    { skill_id: 103, skill_name: "Network Security", category_name: "Cybersecurity & Networking" },
    { skill_id: 104, skill_name: "Web Application Security", category_name: "Cybersecurity & Networking" },
    { skill_id: 105, skill_name: "OAuth 2.0 / JWT Auth", category_name: "Cybersecurity & Networking" },
    { skill_id: 106, skill_name: "Wireshark", category_name: "Cybersecurity & Networking" },
    { skill_id: 107, skill_name: "Information Security", category_name: "Cybersecurity & Networking" },
    { skill_id: 108, skill_name: "MATLAB & Simulink", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 109, skill_name: "ROS (Robot Operating System)", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 110, skill_name: "Embedded C", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 111, skill_name: "Verilog / VHDL", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 112, skill_name: "IoT Architecture", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 113, skill_name: "PLC Programming", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 114, skill_name: "AutoCAD", category_name: "Core Engineering & Embedded Systems" },
    { skill_id: 115, skill_name: "SolidWorks", category_name: "Core Engineering & Embedded Systems" }
  ];

  async function ensureSkillsTaxonomy() {
    if (state.skillsTaxonomy && state.skillsTaxonomy.length > 0) {
      return state.skillsTaxonomy;
    }

    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (data.success && data.data && data.data.skills && data.data.skills.length > 0) {
        state.skillsTaxonomy = data.data.skills;
        return state.skillsTaxonomy;
      }
    } catch (err) {
      console.warn('Could not fetch skills taxonomy:', err);
    }

    state.skillsTaxonomy = PREDEFINED_SKILLS_TAXONOMY_STATIC;
    return state.skillsTaxonomy;
  }

  async function openCreateTeamWizard() {
    if (!state.activeStudent) {
      openAuthModal();
      showToast('Please sign in with your @thapar.edu account to create a team.', 'info');
      return;
    }

    await ensureSkillsTaxonomy();

    // Reset state
    wizardState = {
      step: 1,
      slots: [
        { id: Date.now(), role_title: 'Backend Developer', count: 1, skill_ids: [], match_mode: 'exact' }
      ]
    };

    // Reset Step 1 inputs
    newTeamName.value = '';
    if (newTeamDescription) newTeamDescription.value = '';
    if (newTeamProjectType) newTeamProjectType.value = 'Course Project';
    if (newTeamMaxSize) newTeamMaxSize.value = '4';
    
    // Set default deadline (60 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dateStr = futureDate.toISOString().split('T')[0];
    if (newTeamDeadline) newTeamDeadline.value = dateStr;

    // Creator Profile card updates
    const avatarElem = document.getElementById('wizardCreatorAvatar');
    const nameElem = document.getElementById('wizardCreatorName');
    const subtextElem = document.getElementById('wizardCreatorSubtext');

    if (avatarElem) avatarElem.textContent = getInitials(state.activeStudent.name);
    if (nameElem) nameElem.textContent = `${state.activeStudent.name} (ID #${state.activeStudent.student_id})`;
    if (subtextElem) subtextElem.textContent = `${state.activeStudent.branch} Sem ${state.activeStudent.semester}`;

    updateCharCounters();
    switchWizardStep(1);
    renderSlotsList();
    updateTeamSummaryBar();

    createTeamModal.classList.remove('hidden');
  }

  function updateCharCounters() {
    if (newTeamName && teamNameCharCount) {
      teamNameCharCount.textContent = `${newTeamName.value.length} / 60`;
    }
    if (newTeamDescription && teamDescCharCount) {
      teamDescCharCount.textContent = `${newTeamDescription.value.length} / 300`;
    }
  }

  if (newTeamName) {
    newTeamName.addEventListener('input', () => {
      updateCharCounters();
      updateTeamSummaryBar();
    });
  }

  if (newTeamDescription) {
    newTeamDescription.addEventListener('input', updateCharCounters);
  }

  if (newTeamProjectType) {
    newTeamProjectType.addEventListener('change', updateTeamSummaryBar);
  }

  if (newTeamMaxSize) {
    newTeamMaxSize.addEventListener('change', updateTeamSummaryBar);
  }

  if (newTeamDeadline) {
    newTeamDeadline.addEventListener('change', updateTeamSummaryBar);
  }

  function switchWizardStep(stepNum) {
    wizardState.step = stepNum;
    if (stepNum === 1) {
      createTeamStep1.classList.remove('hidden');
      createTeamStep2.classList.add('hidden');
      stepIndicator1.classList.add('active');
      stepIndicator2.classList.remove('active');
      stepperLine.classList.remove('active');
    } else {
      createTeamStep1.classList.add('hidden');
      createTeamStep2.classList.remove('hidden');
      stepIndicator1.classList.add('active');
      stepIndicator2.classList.add('active');
      stepperLine.classList.add('active');
    }
  }

  if (btnNextToStep2) {
    btnNextToStep2.addEventListener('click', () => {
      const nameVal = newTeamName.value.trim();
      const descVal = newTeamDescription ? newTeamDescription.value.trim() : '';

      if (!nameVal) {
        showToast('Please enter a team name.', 'error');
        newTeamName.focus();
        return;
      }
      if (!descVal) {
        showToast('Please enter a project description.', 'error');
        if (newTeamDescription) newTeamDescription.focus();
        return;
      }

      switchWizardStep(2);
    });
  }

  if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', () => {
      switchWizardStep(1);
    });
  }

  if (btnAddSlotCard) {
    btnAddSlotCard.addEventListener('click', () => {
      wizardState.slots.push({
        id: Date.now(),
        role_title: '',
        count: 1,
        skill_ids: [],
        match_mode: 'exact'
      });
      renderSlotsList();
      updateTeamSummaryBar();
    });
  }

  function updateSlotSkillsUI(idx) {
    const slot = wizardState.slots[idx];
    if (!slot) return;

    const card = document.querySelector(`.slot-card[data-slot-index="${idx}"]`);
    if (!card) return;

    const taxonomy = (state.skillsTaxonomy && state.skillsTaxonomy.length > 0)
      ? state.skillsTaxonomy
      : PREDEFINED_SKILLS_TAXONOMY_STATIC;

    // 1. Update tag pills container
    let tagsWrap = card.querySelector('.slot-skills-tags-wrap');
    const tagPillsHtml = slot.skill_ids.map(skillId => {
      const skillObj = taxonomy.find(s => s.skill_id === parseInt(skillId));
      const skillName = skillObj ? skillObj.skill_name : `Skill #${skillId}`;
      return `
        <span class="tag-pill">
          ${escapeHtml(skillName)}
          <span class="tag-pill-remove" data-slot-index="${idx}" data-skill-id="${skillId}">&times;</span>
        </span>
      `;
    }).join('');

    const formItem = card.querySelector('.slot-custom-skills-dropdown').parentElement;
    if (tagPillsHtml) {
      if (!tagsWrap) {
        tagsWrap = document.createElement('div');
        tagsWrap.className = 'slot-skills-tags-wrap';
        tagsWrap.style.marginBottom = '8px';
        formItem.insertBefore(tagsWrap, card.querySelector('.slot-custom-skills-dropdown'));
      }
      tagsWrap.innerHTML = tagPillsHtml;

      // Re-attach tag pill remove handlers
      tagsWrap.querySelectorAll('.tag-pill-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sIdx = parseInt(e.target.dataset.slotIndex);
          const skId = parseInt(e.target.dataset.skillId);
          wizardState.slots[sIdx].skill_ids = wizardState.slots[sIdx].skill_ids.filter(id => id !== skId);

          // Uncheck checkbox in menu
          const cb = card.querySelector(`.wizard-slot-skill-cb[data-skill-id="${skId}"]`);
          if (cb) cb.checked = false;

          updateSlotSkillsUI(sIdx);
          updateTeamSummaryBar();
        });
      });
    } else if (tagsWrap) {
      tagsWrap.remove();
    }

    // 2. Update trigger button label
    const btnLabel = card.querySelector('.slot-skills-dropdown-btn .dropdown-label');
    const selectedCount = slot.skill_ids.length;
    if (btnLabel) {
      btnLabel.textContent = selectedCount > 0 
        ? `${selectedCount} Skill${selectedCount > 1 ? 's' : ''} Selected` 
        : '+ Add required skill from database...';
    }
  }

  function renderSlotsList() {
    if (!slotsListContainer) return;

    const taxonomy = (state.skillsTaxonomy && state.skillsTaxonomy.length > 0)
      ? state.skillsTaxonomy
      : PREDEFINED_SKILLS_TAXONOMY_STATIC;

    slotsListContainer.innerHTML = wizardState.slots.map((slot, index) => {
      const isDeleteDisabled = wizardState.slots.length === 1;
      const selectedCount = slot.skill_ids.length;

      // Render skill tag pills
      const tagPillsHtml = slot.skill_ids.map(skillId => {
        const skillObj = taxonomy.find(s => s.skill_id === parseInt(skillId));
        const skillName = skillObj ? skillObj.skill_name : `Skill #${skillId}`;
        return `
          <span class="tag-pill">
            ${escapeHtml(skillName)}
            <span class="tag-pill-remove" data-slot-index="${index}" data-skill-id="${skillId}">&times;</span>
          </span>
        `;
      }).join('');

      const sortedTaxonomy = [...taxonomy].sort((a, b) =>
        a.skill_name.localeCompare(b.skill_name, undefined, { sensitivity: 'base' })
      );

      // Generate scrollable checkbox list matching Image 2
      const skillChecklistHtml = sortedTaxonomy.map(sk => {
        const isChecked = slot.skill_ids.includes(sk.skill_id);
        return `
          <label class="checkbox-option wizard-skill-checkbox-option" data-name="${escapeHtml(sk.skill_name).toLowerCase()}">
            <input type="checkbox" class="wizard-slot-skill-cb" data-slot-index="${index}" data-skill-id="${sk.skill_id}" ${isChecked ? 'checked' : ''}>
            <span style="font-weight: 500;">${escapeHtml(sk.skill_name)}</span>
            <span class="wizard-skill-category-badge">(${escapeHtml(sk.category_name)})</span>
          </label>
        `;
      }).join('');

      return `
        <div class="slot-card" data-slot-index="${index}">
          <div class="slot-card-header">
            <div class="slot-card-title">
              <i class="ti ti-layout-grid-dots" style="color: var(--text-sub);"></i>
              <span>Open Slot #${index + 1}</span>
            </div>
            ${!isDeleteDisabled ? `
              <button type="button" class="btn-delete-slot" data-slot-index="${index}" title="Remove Slot">
                <i class="ti ti-trash"></i>
              </button>
            ` : ''}
          </div>

          <div class="form-row-2col" style="margin-bottom: 12px;">
            <div class="form-group-item" style="margin-bottom: 0;">
              <label>Role / Position *</label>
              <div class="input-with-icon">
                <i class="ti ti-user input-icon"></i>
                <input type="text" class="wizard-input slot-role-input" data-slot-index="${index}" placeholder="e.g. Backend Developer" value="${escapeHtml(slot.role_title)}" required>
              </div>
              <span class="field-hint">What role are you looking to fill?</span>
            </div>

            <div class="form-group-item" style="margin-bottom: 0;">
              <label>Number of People *</label>
              <div class="input-with-icon">
                <i class="ti ti-users input-icon"></i>
                <select class="wizard-select slot-count-select" data-slot-index="${index}" required>
                  <option value="1" ${slot.count === 1 ? 'selected' : ''}>1</option>
                  <option value="2" ${slot.count === 2 ? 'selected' : ''}>2</option>
                  <option value="3" ${slot.count === 3 ? 'selected' : ''}>3</option>
                </select>
              </div>
              <span class="field-hint">How many members for this role?</span>
            </div>
          </div>

          <div class="form-group-item" style="margin-bottom: 12px;">
            <label>Required Skills *</label>
            ${tagPillsHtml ? `<div class="slot-skills-tags-wrap" style="margin-bottom: 8px;">${tagPillsHtml}</div>` : ''}

            <div class="dropdown-filter-wrap slot-custom-skills-dropdown" style="position: relative; width: 100%;">
              <div class="custom-dropdown-btn slot-skills-dropdown-btn" data-slot-index="${index}">
                <span class="dropdown-label">${selectedCount > 0 ? `${selectedCount} Skill${selectedCount > 1 ? 's' : ''} Selected` : '+ Add required skill from database...'}</span>
                <i class="ti ti-chevron-down"></i>
              </div>

              <div class="custom-dropdown-menu slot-skills-dropdown-menu hidden" data-slot-index="${index}" style="width: 100%; top: 100%; z-index: 100;">
                <div class="dropdown-search-box">
                  <input type="text" class="filter-input slot-skill-search-input" data-slot-index="${index}" placeholder="Quick find skill..." style="font-size: 12px; padding: 6px 10px;">
                </div>
                <div class="dropdown-menu-header">
                  <span>Predefined Skills Taxonomy</span>
                  <button type="button" class="btn-text-action slot-clear-skills-btn" data-slot-index="${index}">Clear All</button>
                </div>
                <div class="dropdown-menu-list slot-skill-checkbox-list" data-slot-index="${index}">
                  ${skillChecklistHtml}
                </div>
              </div>
            </div>
            <span class="field-hint">Select skills required for this role from the pre-registered database taxonomy.</span>
          </div>

          <div class="form-group-item" style="margin-bottom: 0;">
            <label>All skills required?</label>
            <div class="radio-pill-group">
              <label class="radio-pill-option">
                <input type="radio" name="match_mode_${index}" value="exact" ${slot.match_mode === 'exact' ? 'checked' : ''} class="slot-match-radio" data-slot-index="${index}">
                <span>Yes (All must have)</span>
              </label>
              <label class="radio-pill-option">
                <input type="radio" name="match_mode_${index}" value="partial" ${slot.match_mode === 'partial' ? 'checked' : ''} class="slot-match-radio" data-slot-index="${index}">
                <span>No (Any of these)</span>
              </label>
            </div>
            <span class="field-hint">Should candidates possess all skills or any of them?</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach slot card event listeners
    document.querySelectorAll('.slot-role-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        wizardState.slots[idx].role_title = e.target.value;
        updateTeamSummaryBar();
      });
    });

    document.querySelectorAll('.slot-count-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        wizardState.slots[idx].count = parseInt(e.target.value) || 1;
        updateTeamSummaryBar();
      });
    });

    // Custom Skills Dropdown Toggle
    document.querySelectorAll('.slot-skills-dropdown-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.dataset.slotIndex);
        const menu = document.querySelector(`.slot-skills-dropdown-menu[data-slot-index="${idx}"]`);
        
        // Close all other dropdowns
        document.querySelectorAll('.slot-skills-dropdown-menu').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });

        if (menu) menu.classList.toggle('hidden');
      });
    });

    // Stop propagation inside dropdown menu
    document.querySelectorAll('.slot-skills-dropdown-menu').forEach(menu => {
      menu.addEventListener('click', (e) => e.stopPropagation());
    });

    // Quick find skill search inside slot dropdown
    document.querySelectorAll('.slot-skill-search-input').forEach(searchInput => {
      searchInput.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        const term = e.target.value.toLowerCase().trim();
        const options = document.querySelectorAll(`.slot-skills-dropdown-menu[data-slot-index="${idx}"] .wizard-skill-checkbox-option`);

        options.forEach(opt => {
          const name = opt.dataset.name || '';
          if (!term || name.includes(term)) {
            opt.style.display = 'flex';
          } else {
            opt.style.display = 'none';
          }
        });
      });
    });

    // Skill Checkbox Toggle - Targeted UI Update (Dropdown Menu STAYS OPEN!)
    document.querySelectorAll('.wizard-slot-skill-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        const skillId = parseInt(e.target.dataset.skillId);

        if (e.target.checked) {
          if (!wizardState.slots[idx].skill_ids.includes(skillId)) {
            wizardState.slots[idx].skill_ids.push(skillId);
          }
        } else {
          wizardState.slots[idx].skill_ids = wizardState.slots[idx].skill_ids.filter(id => id !== skillId);
        }

        // Targeted UI update so dropdown stays OPEN while checking/unchecking skills
        updateSlotSkillsUI(idx);
        updateTeamSummaryBar();
      });
    });

    // Clear All Skills for Slot
    document.querySelectorAll('.slot-clear-skills-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.slotIndex);
        wizardState.slots[idx].skill_ids = [];
        
        const card = document.querySelector(`.slot-card[data-slot-index="${idx}"]`);
        if (card) {
          card.querySelectorAll('.wizard-slot-skill-cb').forEach(c => c.checked = false);
        }

        updateSlotSkillsUI(idx);
        updateTeamSummaryBar();
      });
    });

    // Tag Pill Remove Button
    document.querySelectorAll('.tag-pill-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        const skillId = parseInt(e.target.dataset.skillId);
        wizardState.slots[idx].skill_ids = wizardState.slots[idx].skill_ids.filter(id => id !== skillId);

        const card = document.querySelector(`.slot-card[data-slot-index="${idx}"]`);
        if (card) {
          const cb = card.querySelector(`.wizard-slot-skill-cb[data-skill-id="${skillId}"]`);
          if (cb) cb.checked = false;
        }

        updateSlotSkillsUI(idx);
        updateTeamSummaryBar();
      });
    });

    document.querySelectorAll('.slot-match-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.slotIndex);
        wizardState.slots[idx].match_mode = e.target.value;
      });
    });

    document.querySelectorAll('.btn-delete-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.slotIndex);
        wizardState.slots.splice(idx, 1);
        renderSlotsList();
        updateTeamSummaryBar();
      });
    });
  }

  function updateTeamSummaryBar() {
    if (!sumTeamName) return;

    const nameVal = newTeamName ? newTeamName.value.trim() : '';
    const projTypeVal = newTeamProjectType ? newTeamProjectType.value : 'Course Project';
    const maxSizeVal = newTeamMaxSize ? newTeamMaxSize.value : '4';
    const deadlineVal = newTeamDeadline ? newTeamDeadline.value : '';

    sumTeamName.textContent = nameVal || 'AI Study Buddy';
    sumProjectType.textContent = projTypeVal;
    sumTeamSize.textContent = `${maxSizeVal} Members`;

    if (deadlineVal) {
      const d = new Date(deadlineVal);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      sumDeadline.textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      sumDeadline.textContent = 'Set Deadline';
    }

    const totalSlots = wizardState.slots.reduce((acc, s) => acc + (s.count || 1), 0);
    if (sumSlotsDefined) {
      sumSlotsDefined.textContent = `${totalSlots} Open Slot${totalSlots > 1 ? 's' : ''}`;
    }
  }

  async function handleCreateTeamSubmit(e) {
    e.preventDefault();
    const name = newTeamName.value.trim();
    const description = newTeamDescription ? newTeamDescription.value.trim() : '';
    const projectType = newTeamProjectType ? newTeamProjectType.value : 'Course Project';
    const maxSize = newTeamMaxSize ? parseInt(newTeamMaxSize.value) : 4;
    const deadline = newTeamDeadline ? newTeamDeadline.value : null;
    const courseId = newTeamCourse ? newTeamCourse.value : null;

    if (!name || !state.activeStudent) {
      showToast('Team name and active student account are required.', 'error');
      return;
    }

    // Validate slots
    for (let i = 0; i < wizardState.slots.length; i++) {
      const s = wizardState.slots[i];
      if (!s.role_title || !s.role_title.trim()) {
        showToast(`Please enter a role title for Open Slot #${i + 1}.`, 'error');
        switchWizardStep(2);
        return;
      }
      if (!s.skill_ids || s.skill_ids.length === 0) {
        showToast(`Please select at least one required skill for Open Slot #${i + 1}.`, 'error');
        switchWizardStep(2);
        return;
      }
    }

    try {
      const payload = {
        team_name: name,
        description: description,
        project_type: projectType,
        max_members: maxSize,
        deadline: deadline || null,
        course_id: courseId || null,
        created_by: state.activeStudent.student_id,
        slots: wizardState.slots.map(s => ({
          role_title: s.role_title.trim(),
          count: parseInt(s.count) || 1,
          skill_ids: s.skill_ids,
          match_mode: s.match_mode
        }))
      };

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Team and open slots published successfully! 🚀', 'success');
      createTeamModal.classList.add('hidden');

      await fetchMetadata();
      showSearchTeamsView();
    } catch (err) {
      showToast('Error publishing team: ' + err.message, 'error');
    }
  }

  // Helper functions
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function getInitials(name) {
    if (!name) return 'GB';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }
});

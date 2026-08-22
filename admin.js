/**
 * Module: raydiansyah.com admin dashboard interactions
 * Purpose: Run the demo owner gate, switch content panels, and manage local project drafts
 * Used by: admin.html
 * Dependencies: Browser DOM APIs and localStorage; Supabase Auth/PostgREST is a future adapter
 * Public functions: login, logout, renderProjects, addProject
 * Side effects: Writes demo session and draft projects to localStorage; no production API call
 */
const demoProjects = [
  ['Nara Living','Website'],['Kopi Titik Temu','Web app'],['Aru Studio','Brand system'],['Folk Supply','Website'],['Sora Works','Website'],['Tumbuh Finance','Web app'],['Kala Coffee','Brand system'],['Ruang Antara','Website'],['Laju Logistics','Web app'],['Selaras Health','Website']
];
const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const projects = JSON.parse(localStorage.getItem('raydiansyah-projects') || 'null') || demoProjects.map(([title,category]) => ({title,category,status:'Published',updated:'Today'}));
const renderProjects = () => { document.querySelector('#project-list').innerHTML = projects.map((project) => `<div class="project-row"><strong>${project.title}</strong><span>${project.category}</span><span class="status">● ${project.status}</span><span>${project.updated}</span></div>`).join(''); };
const showDashboard = () => { loginView.hidden = true; dashboardView.hidden = false; renderProjects(); };
document.querySelector('#login-form').addEventListener('submit', (event) => { event.preventDefault(); localStorage.setItem('raydiansyah-admin-session','demo'); showDashboard(); });
document.querySelector('#logout-button').addEventListener('click', () => { localStorage.removeItem('raydiansyah-admin-session'); dashboardView.hidden = true; loginView.hidden = false; });
document.querySelectorAll('[data-panel]').forEach((trigger) => trigger.addEventListener('click', () => { const panel = trigger.dataset.panel; if (!panel) return; document.querySelectorAll('.side-link').forEach((item) => item.classList.toggle('active', item.dataset.panel === panel)); document.querySelectorAll('.panel').forEach((item) => item.classList.toggle('active-panel', item.dataset.content === panel)); document.querySelector('#panel-title').textContent = panel === 'overview' ? 'Good morning, Suprayogo.' : `${panel[0].toUpperCase()}${panel.slice(1)} content`; }));
document.querySelector('#add-project').addEventListener('click', () => document.querySelector('#project-dialog').showModal());
document.querySelector('#project-form').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); projects.unshift({title:data.get('title'),category:data.get('category'),status:'Draft',updated:'Just now'}); localStorage.setItem('raydiansyah-projects', JSON.stringify(projects)); event.currentTarget.closest('dialog').close(); renderProjects(); document.querySelector('[data-panel="portfolio"]').click(); });
if (localStorage.getItem('raydiansyah-admin-session') === 'demo') showDashboard();

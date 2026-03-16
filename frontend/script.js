javascript
// API Cloudflare Worker
const API_URL = "https://blogreact12-api.reatest.workers.dev/api";

// Mobile Navigation Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Check authentication and update navigation
function checkAuthAndNav() {
    const token = localStorage.getItem('auth_token');
    const desktopNav = document.querySelector('.hidden.md\\:block .ml-10');
    const mobileNav = document.getElementById('mobile-menu');

    if (!desktopNav || !mobileNav) return;

    if (token) {
        desktopNav.innerHTML = `
            <a href="#" class="px-3 py-2 text-sm font-medium">Accueil</a>
            <a href="dashboard.html" class="px-3 py-2 text-sm font-medium">Administration</a>
            <button onclick="logout()" class="px-3 py-2 text-sm font-medium text-red-600">Déconnexion</button>
        `;

        mobileNav.innerHTML = `
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="#" class="block px-3 py-2 text-base font-medium">Accueil</a>
                <a href="dashboard.html" class="block px-3 py-2 text-base font-medium">Administration</a>
                <button onclick="logout()" class="block w-full text-left px-3 py-2 text-base font-medium text-red-600">Déconnexion</button>
            </div>
        `;
    } else {
        desktopNav.innerHTML = `
            <a href="#" class="px-3 py-2 text-sm font-medium">Accueil</a>
            <a href="login.html" class="px-3 py-2 text-sm font-medium">Connexion</a>
        `;

        mobileNav.innerHTML = `
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="#" class="block px-3 py-2 text-base font-medium">Accueil</a>
                <a href="login.html" class="block px-3 py-2 text-base font-medium">Connexion</a>
            </div>
        `;
    }
}

// Logout
function logout() {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
        localStorage.removeItem("auth_token");
        window.location.href = "login.html";
    }
}

// Loading animation
function showLoading() {
    const articlesGrid = document.getElementById("articles-grid");

    articlesGrid.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
        </div>
    `;
}

// Display articles
function displayArticles(articles) {

    const grid = document.getElementById("articles-grid");
    const noArticles = document.getElementById("no-articles");
    const error = document.getElementById("error-message");

    if (noArticles) noArticles.classList.add("hidden");
    if (error) error.classList.add("hidden");

    if (!articles || articles.length === 0) {
        if (noArticles) noArticles.classList.remove("hidden");
        return;
    }

    let html = "";

    articles.forEach((article, index) => {

        html += `
        <article class="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
                 onclick="viewArticle('${article.id}')">

            <img src="https://picsum.photos/seed/${article.id}/600/400"
                 class="w-full h-48 object-cover">

            <div class="p-6">

                <div class="flex justify-between mb-2 text-sm text-gray-500">
                    <span>${new Date(article.date).toLocaleDateString('fr-FR')}</span>
                    <span>${article.auteur || "Admin"}</span>
                </div>

                <h2 class="text-xl font-bold mb-2">${article.titre}</h2>

                <p class="text-gray-600 line-clamp-3">
                    ${article.contenu}
                </p>

                <div class="flex justify-between mt-4 text-sm text-gray-500">
                    <span>👁 ${article.views || 0}</span>
                    <span>❤️ ${article.likes || 0}</span>
                </div>

            </div>

        </article>
        `;
    });

    grid.innerHTML = html;
}

// View article
function viewArticle(id) {
    window.location.href = `article.html?id=${id}`;
}

// Charger les articles depuis Cloudflare
async function loadArticles() {

    try {

        showLoading();

        const response = await fetch(`${API_URL}/articles`);

        const result = await response.json();

        const articles = Array.isArray(result.data) ? result.data : [result.data];

        articles.sort((a, b) => new Date(b.date) - new Date(a.date));

        displayArticles(articles);

    } catch (error) {

        console.error("Erreur chargement articles:", error);

        const errorDiv = document.getElementById("error-message");
        if (errorDiv) errorDiv.classList.remove("hidden");
    }
}

// Initialisation
function init() {

    checkAuthAndNav();

    loadArticles();

    window.addEventListener("scroll", () => {

        const nav = document.querySelector("nav");

        if (!nav) return;

        if (window.scrollY > 50) {
            nav.classList.add("shadow-lg");
        } else {
            nav.classList.remove("shadow-lg");
        }
    });
}

document.addEventListener("DOMContentLoaded", init);

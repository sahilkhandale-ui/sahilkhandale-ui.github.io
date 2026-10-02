document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    const icon = themeToggleBtn.querySelector('i');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    } else {
        updateIcon('light');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // --- SPA Tab Switching Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');

            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);

            if (targetContent) {
                targetContent.classList.add('active');
                // Reset carousel positions when a tab is opened (mobile only)
                resetAllCarousels();
            }
        });
    });

    // --- Desktop Toggle Load More / Show Less Logic ---
    const toggleGridBtns = document.querySelectorAll('.toggle-grid-btn');
    toggleGridBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetGridId = this.getAttribute('data-target-grid');
            const grid = document.getElementById(targetGridId);
            const isExpanded = this.getAttribute('data-expanded') === 'true';

            if (grid) {
                if (isExpanded) {
                    // Currently Expanded -> Shrink it
                    grid.classList.remove('show-all');
                    this.setAttribute('data-expanded', 'false');
                    this.textContent = 'Load More';

                    // Scroll up smoothly to context (the section heading)
                    const section = grid.closest('section');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    // Currently Shrunk -> Expand it
                    grid.classList.add('show-all');
                    this.setAttribute('data-expanded', 'true');
                    this.textContent = 'Show Less';
                }
            }
        });
    });

    // --- Mobile Carousel Logic ---
    const carousels = document.querySelectorAll('.carousel-container');
    const carouselStates = new Map(); // Store state for each carousel

    function initializeCarousels() {
        carousels.forEach(container => {
            const track = container.querySelector('.projects-grid');
            const cards = Array.from(track.querySelectorAll('.project-card'));
            const prevBtn = container.querySelector('.prev-btn');
            const nextBtn = container.querySelector('.next-btn');

            carouselStates.set(container, {
                currentIndex: 0,
                track: track,
                cards: cards
            });

            function updateTransform() {
                const state = carouselStates.get(container);
                if (window.innerWidth <= 768) {
                    // Translate by index * 100% plus the gap (1.5rem)
                    state.track.style.transform = `translateX(calc(-${state.currentIndex * 100}% - ${state.currentIndex * 1.5}rem))`;
                } else {
                    state.track.style.transform = '';
                }
            }

            if (nextBtn && prevBtn) {
                nextBtn.addEventListener('click', () => {
                    if (window.innerWidth > 768) return;
                    const state = carouselStates.get(container);
                    // Loop logic: Next on last goes to first
                    state.currentIndex = (state.currentIndex + 1) % state.cards.length;
                    updateTransform();
                });

                prevBtn.addEventListener('click', () => {
                    if (window.innerWidth > 768) return;
                    const state = carouselStates.get(container);
                    // Loop logic: Prev on first goes to last
                    state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
                    updateTransform();
                });
            }

            // Touch Swipe Logic
            let startX = 0;
            let currentX = 0;

            container.addEventListener('touchstart', (e) => {
                if (window.innerWidth > 768) return;
                startX = e.touches[0].clientX;
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (window.innerWidth > 768) return;
                currentX = e.touches[0].clientX;
            }, { passive: true });

            container.addEventListener('touchend', () => {
                if (window.innerWidth > 768) return;
                const diffX = startX - currentX;
                const state = carouselStates.get(container);

                if (Math.abs(diffX) > 50 && currentX !== 0) { // Threshold for swipe
                    if (diffX > 0) {
                        // Swiped left -> Next
                        state.currentIndex = (state.currentIndex + 1) % state.cards.length;
                    } else {
                        // Swiped right -> Prev
                        state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
                    }
                    updateTransform();
                }
                startX = 0;
                currentX = 0;
            });
        });
    }

    // Function to reset carousel views when resizing or changing tabs
    function resetAllCarousels() {
        carousels.forEach(container => {
            const state = carouselStates.get(container);
            if (state) {
                state.currentIndex = 0;
                if (window.innerWidth <= 768) {
                    state.track.style.transform = `translateX(0)`;
                } else {
                    state.track.style.transform = '';
                }
            }
        });
    }

    initializeCarousels();

    // Handle switching back to desktop cleanly
    window.addEventListener('resize', () => {
        carousels.forEach(container => {
            const state = carouselStates.get(container);
            if (state) {
                if (window.innerWidth <= 768) {
                    state.track.style.transform = `translateX(calc(-${state.currentIndex * 100}% - ${state.currentIndex * 1.5}rem))`;
                } else {
                    // Clear inline styles so CSS grid takes over
                    state.track.style.transform = '';
                }
            }
        });
    });

});

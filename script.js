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

    // --- Scroll Line Helper Function ---
    function updateScrollLine(scrollContainer, trackEl, thumbEl) {
        if (!scrollContainer || !trackEl || !thumbEl) return;
        const clientWidth = scrollContainer.clientWidth;
        const scrollWidth = scrollContainer.scrollWidth;
        const scrollLeft = scrollContainer.scrollLeft;

        if (scrollWidth <= clientWidth) {
            thumbEl.style.width = '100%';
            thumbEl.style.transform = 'translateX(0px)';
            return;
        }

        const ratio = clientWidth / scrollWidth;
        const trackWidth = trackEl.clientWidth;
        const thumbWidth = Math.max(trackWidth * ratio, 28);
        thumbEl.style.width = `${thumbWidth}px`;

        const maxScroll = scrollWidth - clientWidth;
        const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
        const maxThumbTranslate = trackWidth - thumbWidth;
        const translateX = progress * maxThumbTranslate;

        thumbEl.style.transform = `translateX(${translateX}px)`;
    }

    // --- Mobile Tabs Scroll Line Logic ---
    const tabsNav = document.querySelector('.tabs');
    const tabsScrollLine = document.querySelector('.tabs-scroll-line');
    const tabsScrollThumb = document.querySelector('.tabs-scroll-thumb');

    if (tabsNav && tabsScrollLine && tabsScrollThumb) {
        tabsNav.addEventListener('scroll', () => {
            if (window.innerWidth <= 768) {
                updateScrollLine(tabsNav, tabsScrollLine, tabsScrollThumb);
            }
        }, { passive: true });

        // Click track to scroll tabs
        tabsScrollLine.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            const rect = tabsScrollLine.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            const maxScroll = tabsNav.scrollWidth - tabsNav.clientWidth;
            tabsNav.scrollTo({
                left: ratio * maxScroll,
                behavior: 'smooth'
            });
        });
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

                if (window.innerWidth <= 768) {
                    // Center the active tab in view on mobile
                    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    setTimeout(() => {
                        if (tabsNav && tabsScrollLine && tabsScrollThumb) {
                            updateScrollLine(tabsNav, tabsScrollLine, tabsScrollThumb);
                        }
                    }, 100);

                    // Refresh carousel in the activated tab
                    const carouselInTab = targetContent.querySelector('.carousel-container');
                    if (carouselInTab) {
                        const grid = carouselInTab.querySelector('.projects-grid');
                        const line = carouselInTab.querySelector('.carousel-scroll-line');
                        const thumb = carouselInTab.querySelector('.carousel-scroll-thumb');
                        if (grid) {
                            grid.scrollLeft = 0;
                            setTimeout(() => {
                                updateScrollLine(grid, line, thumb);
                            }, 60);
                        }
                    }
                }
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

    // --- Mobile Card Carousel Scroll Line & Drag Logic ---
    const carousels = document.querySelectorAll('.carousel-container');

    function initializeCarousels() {
        carousels.forEach(container => {
            const grid = container.querySelector('.projects-grid');
            const line = container.querySelector('.carousel-scroll-line');
            const thumb = container.querySelector('.carousel-scroll-thumb');

            if (!grid || !line || !thumb) return;

            // Scroll listener for real-time thumb tracking
            grid.addEventListener('scroll', () => {
                if (window.innerWidth <= 768) {
                    updateScrollLine(grid, line, thumb);
                }
            }, { passive: true });

            // Click on scroll line to scroll smoothly
            line.addEventListener('click', (e) => {
                if (window.innerWidth > 768) return;
                const rect = line.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                const maxScroll = grid.scrollWidth - grid.clientWidth;
                grid.scrollTo({
                    left: ratio * maxScroll,
                    behavior: 'smooth'
                });
            });

            // Mouse Drag Support on mobile / responsive mode
            let isDown = false;
            let startX = 0;
            let scrollStart = 0;

            grid.addEventListener('mousedown', (e) => {
                if (window.innerWidth > 768) return;
                isDown = true;
                grid.style.scrollBehavior = 'auto';
                startX = e.pageX - grid.offsetLeft;
                scrollStart = grid.scrollLeft;
            });

            window.addEventListener('mouseup', () => {
                if (isDown) {
                    isDown = false;
                    grid.style.scrollBehavior = 'smooth';
                }
            });

            grid.addEventListener('mouseleave', () => {
                if (isDown) {
                    isDown = false;
                    grid.style.scrollBehavior = 'smooth';
                }
            });

            grid.addEventListener('mousemove', (e) => {
                if (!isDown || window.innerWidth > 768) return;
                e.preventDefault();
                const x = e.pageX - grid.offsetLeft;
                const walk = (x - startX) * 1.4;
                grid.scrollLeft = scrollStart - walk;
            });
        });
    }

    function updateAllScrollLines() {
        if (window.innerWidth <= 768) {
            if (tabsNav && tabsScrollLine && tabsScrollThumb) {
                updateScrollLine(tabsNav, tabsScrollLine, tabsScrollThumb);
            }
            carousels.forEach(container => {
                const grid = container.querySelector('.projects-grid');
                const line = container.querySelector('.carousel-scroll-line');
                const thumb = container.querySelector('.carousel-scroll-thumb');
                if (container.closest('.tab-content.active') && grid && line && thumb) {
                    updateScrollLine(grid, line, thumb);
                }
            });
        }
    }

    initializeCarousels();
    // Allow DOM to settle before initial sizing
    setTimeout(updateAllScrollLines, 100);

    // Handle resize between desktop and mobile smoothly
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            // Reset any inline styles on grids so desktop CSS grid takes over cleanly
            carousels.forEach(container => {
                const grid = container.querySelector('.projects-grid');
                if (grid) {
                    grid.style.scrollBehavior = '';
                }
            });
        } else {
            updateAllScrollLines();
        }
    });

});

document.addEventListener('DOMContentLoaded', () => {

    const htmlElement = document.documentElement;

    // --- Safe Storage Helper (avoids SecurityError on file:/// or restricted environments) ---
    function getStorage(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch {
            return fallback;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Silently fallback if localStorage is blocked/sandboxed
        }
    }

    // --- Toast Notification Helper ---
    const toast = document.getElementById('toast');
    let toastTimeout;

    function showToast(msg) {
        if (!toast) return;
        clearTimeout(toastTimeout);
        toast.textContent = msg;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // --- Theme Toggle Logic (Default: Dark Mode) ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    const savedTheme = getStorage('theme', 'dark');
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            htmlElement.setAttribute('data-theme', newTheme);
            setStorage('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeIcon) return;
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeToggleBtn?.setAttribute('aria-label', 'Switch to Light Theme');
            themeToggleBtn?.setAttribute('title', 'Switch to Light Theme (Press T)');
        } else {
            themeIcon.className = 'fas fa-moon';
            themeToggleBtn?.setAttribute('aria-label', 'Switch to Dark Theme');
            themeToggleBtn?.setAttribute('title', 'Switch to Dark Theme (Press T)');
        }
    }

    // --- Global Motion / Animations Toggle Logic ---
    const motionToggleBtn = document.getElementById('motionToggle');
    const motionIcon = motionToggleBtn ? motionToggleBtn.querySelector('i') : null;

    function resetAllTransforms() {
        const selector = '.project-card, .timeline-card, .stat-box, .wip-banner, .tab-btn, .load-more-btn, .btn, .cv-btn, .theme-toggle, .motion-toggle, .socials a, .badge, .profile-img, .profile-hud-wrap';
        document.querySelectorAll(selector).forEach(el => {
            el.style.transform = '';
            el.style.willChange = 'auto';
            el.style.transition = '';
        });
    }

    function setMotionState(state, notify = false) {
        htmlElement.setAttribute('data-motion', state);
        setStorage('motion', state);

        if (!motionToggleBtn) return;

        if (state === 'reduced') {
            if (motionIcon) motionIcon.className = 'fas fa-play';
            motionToggleBtn.classList.add('is-paused');
            motionToggleBtn.setAttribute('aria-label', 'Enable Animations');
            motionToggleBtn.setAttribute('title', 'Enable Animations (Press M)');
            motionToggleBtn.setAttribute('aria-pressed', 'true');
            resetAllTransforms();
            if (notify) {
                showToast('ANIMATIONS: OFF');
            }
        } else {
            if (motionIcon) motionIcon.className = 'fas fa-pause';
            motionToggleBtn.classList.remove('is-paused');
            motionToggleBtn.setAttribute('aria-label', 'Disable Animations');
            motionToggleBtn.setAttribute('title', 'Disable Animations (Press M)');
            motionToggleBtn.setAttribute('aria-pressed', 'false');
            if (notify) {
                showToast('ANIMATIONS: ON');
            }
        }
    }

    const savedMotion = getStorage('motion');
    const systemPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialMotion = savedMotion ? savedMotion : (systemPrefersReduced ? 'reduced' : 'full');
    setMotionState(initialMotion, false);

    if (motionToggleBtn) {
        motionToggleBtn.addEventListener('click', () => {
            const currentMotion = htmlElement.getAttribute('data-motion') || 'full';
            const nextMotion = currentMotion === 'reduced' ? 'full' : 'reduced';
            setMotionState(nextMotion, true);
        });
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

        const maxScroll = Math.max(1, scrollWidth - clientWidth);
        const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
        const maxThumbTranslate = Math.max(0, trackWidth - thumbWidth);
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
                behavior: 'auto'
            });
        });
    }

    // --- SPA Tab Switching Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.transform = '';
            });
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            btn.style.transform = '';

            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);

            if (targetContent) {
                targetContent.classList.add('active');

                if (targetId === 'about-tab') {
                    animateStats();
                }

                if (window.innerWidth <= 768 && tabsNav) {
                    // Smoothly center the tapped tab horizontally inside tabsNav without jumping the page vertically
                    const tabsRect = tabsNav.getBoundingClientRect();
                    const btnRect = btn.getBoundingClientRect();
                    const scrollOffset = (btnRect.left - tabsRect.left) + tabsNav.scrollLeft - (tabsRect.width / 2) + (btnRect.width / 2);
                    tabsNav.scrollTo({
                        left: Math.max(0, scrollOffset),
                        behavior: 'smooth'
                    });

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
            this.style.transform = '';
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
                        section.scrollIntoView({ behavior: 'auto', block: 'start' });
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
                    behavior: 'auto'
                });
            });

            // Mouse Drag Support on mobile / responsive mode
            let isDown = false;
            let startX = 0;
            let scrollStart = 0;

            const stopDrag = () => {
                if (isDown) {
                    isDown = false;
                    grid.style.scrollBehavior = '';
                }
            };

            grid.addEventListener('mousedown', (e) => {
                if (window.innerWidth > 768) return;
                isDown = true;
                grid.style.scrollBehavior = 'auto';
                startX = e.pageX - grid.offsetLeft;
                scrollStart = grid.scrollLeft;
            });

            grid.addEventListener('mouseleave', stopDrag);
            window.addEventListener('mouseup', stopDrag, { once: false });

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

    // --- Keyboard Shortcuts: 'T' for Theme, 'M' for Motion/Animations ---
    window.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        if (e.key === 't' || e.key === 'T') {
            if (themeToggleBtn) themeToggleBtn.click();
        } else if (e.key === 'm' || e.key === 'M') {
            if (motionToggleBtn) motionToggleBtn.click();
        }
    });

    // --- High-Performance GPU Ambient Glow Tracker ---
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
        let glowX = -1000, glowY = -1000, glowTicking = false;
        window.addEventListener('pointermove', (e) => {
            if (htmlElement.getAttribute('data-motion') === 'reduced') return;
            glowX = e.clientX;
            glowY = e.clientY;
            if (!glowTicking) {
                requestAnimationFrame(() => {
                    cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
                    glowTicking = false;
                });
                glowTicking = true;
            }
        }, { passive: true });
    }


    // --- Quick Copy Email Toast ---
    const emailLink = document.querySelector('a[href^="mailto:"]');

    if (emailLink) {
        emailLink.addEventListener('click', () => {
            const email = 'sahilk927077@gmail.com';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email).then(() => {
                    showToast('COPIED: sahilk927077@gmail.com');
                }).catch(() => {});
            }
        });
    }

    // --- Unified Interactive 3D Perspective Tilt Engine (Zero Layout Thrash, 60-144fps RAF) ---
    function apply3DTilt(selector, maxTilt = 8, perspective = 500, baseOffset = 'translate(-3px, -3px)') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            let isHovered = false;
            let rect = null;
            let rafId = null;
            let clientX = 0;
            let clientY = 0;

            const onMouseEnter = () => {
                if (window.innerWidth <= 768) return;
                if (htmlElement.getAttribute('data-motion') === 'reduced') return;
                isHovered = true;
                rect = el.getBoundingClientRect();
                // Disable transition on transform during active mouse tracking to eliminate stutter
                el.style.transition = 'box-shadow 0.18s ease, border-color 0.18s ease';
                el.style.willChange = 'transform';
            };

            const onMouseMove = (e) => {
                if (!isHovered || !rect || window.innerWidth <= 768) return;
                if (htmlElement.getAttribute('data-motion') === 'reduced') return;

                // When cursor is over a button inside a card, avoid parent card jitter
                if (e.target.closest('.btn') && el.classList.contains('project-card')) {
                    return;
                }

                clientX = e.clientX;
                clientY = e.clientY;

                if (!rafId) {
                    rafId = requestAnimationFrame(() => {
                        rafId = null;
                        if (!isHovered || !rect) return;
                        const x = clientX - rect.left;
                        const y = clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -maxTilt;
                        const rotateY = ((x - centerX) / centerX) * maxTilt;

                        el.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) ${baseOffset}`;
                    });
                }
            };

            const onMouseLeave = () => {
                isHovered = false;
                rect = null;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                el.style.willChange = 'auto';
                if (htmlElement.getAttribute('data-motion') !== 'reduced') {
                    el.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s ease';
                }
                el.style.transform = '';
            };

            el.addEventListener('mouseenter', onMouseEnter, { passive: true });
            el.addEventListener('mousemove', onMouseMove, { passive: true });
            el.addEventListener('mouseleave', onMouseLeave, { passive: true });
            el.addEventListener('click', () => {
                el.style.transform = '';
            });
        });
    }

    // 1. Cards (Project cards, Timeline experience/education cards, Stat cards, WIP banner)
    apply3DTilt('.project-card', 8, 550, 'translate(-4px, -4px)');
    apply3DTilt('.timeline-card', 7, 500, 'translate(-3px, -3px)');
    apply3DTilt('.stat-box', 8, 450, 'translate(-3px, -3px)');
    apply3DTilt('.wip-banner', 5, 650, 'translate(-3px, -3px)');

    // 2. Buttons & Actions (Load More, Action buttons, Download CV, Theme toggle, Socials, Badges)
    apply3DTilt('.load-more-btn', 7, 400, 'translate(-3px, -3px)');
    apply3DTilt('.btn:not(.wip-btn)', 8, 350, 'translate(-2px, -2px)');
    apply3DTilt('.cv-btn', 7, 400, 'translate(-2px, -2px)');
    apply3DTilt('.theme-toggle, .motion-toggle', 10, 300, 'translate(-2px, -2px)');
    apply3DTilt('.socials a', 10, 300, 'translate(-2px, -2px)');
    apply3DTilt('.badge', 7, 350, 'translate(-2px, -2px)');

    // 3. Profile Picture Avatar & Camera HUD Viewfinder
    apply3DTilt('.profile-hud-wrap', 9, 400, 'translate(-3px, -3px)');

    // --- Animated Number Counter for Stats Strip ---
    let statsAnimated = false;
    function animateStats() {
        if (statsAnimated) return;
        const statBoxes = document.querySelectorAll('.stat-box');
        if (!statBoxes.length) return;

        const targets = [
            { el: statBoxes[0]?.querySelector('.stat-number'), end: 3, suffix: '+' },
            { el: statBoxes[1]?.querySelector('.stat-number'), end: 40, suffix: '+' },
            { el: statBoxes[2]?.querySelector('.stat-number'), end: 100, suffix: '%' }
        ];

        if (htmlElement.getAttribute('data-motion') === 'reduced') {
            targets.forEach(t => {
                if (t.el) t.el.textContent = `${t.end}${t.suffix}`;
            });
            statsAnimated = true;
            return;
        }

        targets.forEach(t => {
            if (!t.el) return;
            const duration = 1200;
            const startTime = performance.now();
            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Smooth easeOutExpo
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(ease * t.end);
                t.el.textContent = `${current}${t.suffix}`;
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    t.el.textContent = `${t.end}${t.suffix}`;
                }
            }
            requestAnimationFrame(update);
        });
        statsAnimated = true;
    }

});

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.custom-cursor');
    const links = document.querySelectorAll('a, .stat-card, .work-item');
    
    // Smooth Cursor Lerp
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        let distX = mouseX - cursorX;
        let distY = mouseY - cursorY;
        
        cursorX = cursorX + (distX * 0.15);
        cursorY = cursorY + (distY * 0.15);
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Cursor interactions
    links.forEach(link => {
        link.addEventListener('mouseenter', () => cursor.classList.add('grow'));
        link.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
    });

    // Optimized Parallax effect using requestAnimationFrame
    let ticking = false;
    document.addEventListener('mousemove', (e) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const bgDecoration = document.querySelector('.bg-decoration');
                if (bgDecoration) {
                    const moveX = (e.clientX * -0.05);
                    const moveY = (e.clientY * -0.05);
                    bgDecoration.style.transform = `translate(${moveX}px, ${moveY}px)`;
                }

                const mainContent = document.querySelector('main');
                if (mainContent) {
                    const mainMoveX = (e.clientX * 0.02);
                    const mainMoveY = (e.clientY * 0.02);
                    mainContent.style.transform = `translate(${mainMoveX}px, ${mainMoveY}px)`;
                }

                // Magnetic effect for social links and nav
                const magneticElements = document.querySelectorAll('.hero-socials a, .top-nav a, .resume-button');
                magneticElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const deltaX = e.clientX - centerX;
                    const deltaY = e.clientY - centerY;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance < 100) {
                        // Map distance to movement (max 15px)
                        const moveX = (deltaX / 100) * 15;
                        const moveY = (deltaY / 100) * 15;
                        el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
                        el.style.transition = 'transform 0.1s ease-out';
                    } else {
                        el.style.transform = `translate(0, 0) scale(1)`;
                        el.style.transition = 'transform 0.4s ease-out';
                    }
                });

                ticking = false;
            });
            ticking = true;
        }
    });

    // Text Scramble Class for technical text transitions
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => (this.resolve = resolve));
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.chars[Math.floor(Math.random() * this.chars.length)];
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
    }

    // Intersection Observer for scroll reveal animations
    const revealOptions = {
        threshold: 0.2
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Trigger scramble animation on section headings
                const heading = entry.target.querySelector('.section-heading');
                if (heading && !heading.dataset.scrambled) {
                    const fx = new TextScramble(heading);
                    fx.setText(heading.innerText);
                    heading.dataset.scrambled = 'true';
                }

                // Stagger children logic
                const items = entry.target.querySelectorAll('.stagger-item');
                items.forEach((item, index) => {
                    item.style.transitionDelay = `${index * 0.15}s`;
                });
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(section => {
        revealObserver.observe(section);
    });

    // Navigation hover effects (removed scrambling for better UX)
    // document.querySelectorAll('.top-nav a').forEach(link => {
    //     const fx = new TextScramble(link);
    //     link.addEventListener('mouseenter', () => {
    //         fx.setText(link.innerText);
    //     });
    // });

    // Smooth scroll for top navigation links
    document.querySelectorAll('.top-nav .nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
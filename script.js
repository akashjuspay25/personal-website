// ===== PARTICLE NETWORK SYSTEM =====
class ParticleNetwork {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.maxParticles = window.innerWidth < 768 ? 25 : 50;
        this.connectionDistance = 120;
        this.mouseDistance = 200;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Track mouse for interactive particles
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle, i) => {
            // Pulse effect
            particle.pulse += 0.02;
            const pulseFactor = 1 + Math.sin(particle.pulse) * 0.2;

            // Mouse interaction - particles flee from cursor
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouseDistance) {
                    const force = (this.mouseDistance - distance) / this.mouseDistance;
                    particle.vx -= (dx / distance) * force * 0.5;
                    particle.vy -= (dy / distance) * force * 0.5;
                }
            }

            // Apply velocity with damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Minimum velocity
            if (Math.abs(particle.vx) < 0.1) particle.vx += (Math.random() - 0.5) * 0.2;
            if (Math.abs(particle.vy) < 0.1) particle.vy += (Math.random() - 0.5) * 0.2;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;

            // Draw particle with glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3 * pulseFactor
            );
            gradient.addColorStop(0, `rgba(139, 92, 246, ${particle.alpha})`);
            gradient.addColorStop(0.5, `rgba(6, 182, 212, ${particle.alpha * 0.5})`);
            gradient.addColorStop(1, 'transparent');

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius * 3 * pulseFactor, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Draw connections
            let connections = 0;
            for (let j = i + 1; j < this.particles.length; j++) {
                if (connections >= 3) break;

                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.4;
                    const lineGradient = this.ctx.createLinearGradient(
                        particle.x, particle.y, other.x, other.y
                    );
                    lineGradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
                    lineGradient.addColorStop(1, `rgba(6, 182, 212, ${opacity})`);

                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = lineGradient;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    connections++;
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ===== CUSTOM CURSOR WITH TRAIL =====
class EnhancedCursor {
    constructor() {
        this.cursor = document.querySelector('.custom-cursor');
        this.trails = [];
        this.maxTrails = 5;

        if (!this.cursor || window.matchMedia('(pointer: coarse)').matches) {
            if (this.cursor) this.cursor.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }

        this.createTrailElements();
        this.init();
    }

    createTrailElements() {
        for (let i = 0; i < this.maxTrails; i++) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.cssText = `
                position: fixed;
                width: ${8 - i}px;
                height: ${8 - i}px;
                background: rgba(139, 92, 246, ${0.3 - i * 0.05});
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                mix-blend-mode: screen;
                transform: translate(-50%, -50%);
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(trail);
            this.trails.push({
                element: trail,
                x: 0,
                y: 0
            });
        }
    }

    init() {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        const animate = () => {
            // Main cursor follows with lerp
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;
            cursorX += dx * 0.15;
            cursorY += dy * 0.15;

            this.cursor.style.left = cursorX + 'px';
            this.cursor.style.top = cursorY + 'px';

            // Trails follow with increasing delay
            this.trails.forEach((trail, index) => {
                const delay = (index + 1) * 0.08;
                trail.x += (cursorX - trail.x) * delay;
                trail.y += (cursorY - trail.y) * delay;
                trail.element.style.left = trail.x + 'px';
                trail.element.style.top = trail.y + 'px';
            });

            requestAnimationFrame(animate);
        };
        animate();

        // Hover effects with color change
        const interactiveElements = document.querySelectorAll(
            'a, button, .work-item, .skill-category, .stat-card, .edu-card, .exp-item, .achievement-item, .tag, .skill-tag'
        );

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('grow');
                this.trails.forEach(t => t.element.style.opacity = '0');
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('grow');
                this.trails.forEach(t => t.element.style.opacity = '1');
            });
        });
    }
}

// ===== TYPEWRITER EFFECT =====
class TypeWriter {
    constructor(element, text, speed = 50) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
    }

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }

    static initForHero() {
        const heroBio = document.querySelector('.hero-bio');
        if (!heroBio) return;

        const originalText = heroBio.textContent;
        heroBio.textContent = '';
        heroBio.style.opacity = '1';

        setTimeout(() => {
            new TypeWriter(heroBio, originalText, 30).type();
        }, 800);
    }
}

// ===== NUMBER COUNTER ANIMATION =====
class CounterAnimation {
    constructor(element, target, suffix = '', duration = 2000) {
        this.element = element;
        this.target = target;
        this.suffix = suffix;
        this.duration = duration;
        this.startTime = null;
        this.hasAnimated = false;
    }

    animate(currentTime) {
        if (!this.startTime) this.startTime = currentTime;
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * this.target);

        this.element.textContent = current + this.suffix;

        if (progress < 1) {
            requestAnimationFrame((time) => this.animate(time));
        } else {
            this.element.textContent = this.target + this.suffix;
        }
    }

    static init() {
        const counters = document.querySelectorAll('.stat-num, .stat-card h3');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    const text = entry.target.textContent;
                    const match = text.match(/(\d+)/);

                    if (match) {
                        const num = parseInt(match[1]);
                        const suffix = text.replace(/\d+/, '');
                        const counter = new CounterAnimation(entry.target, num, suffix, 2000);
                        requestAnimationFrame((time) => counter.animate(time));
                    }
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }
}

// ===== TEXT SCRAMBLE EFFECT =====
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#';
        this.originalText = el.innerText;
    }

    setText(newText) {
        const length = Math.max(this.originalText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = this.originalText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 20);
            const end = start + Math.floor(Math.random() * 20);
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

        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end } = this.queue[i];
            let char = this.queue[i].char;

            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span style="opacity: 0.5">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }

    static initHoverEffects() {
        const headings = document.querySelectorAll('.work-content h3, .skill-header h3');
        headings.forEach(heading => {
            const fx = new TextScramble(heading);
            heading.addEventListener('mouseenter', () => {
                fx.setText(fx.originalText);
            });
        });
    }
}

// ===== SCROLL REVEAL WITH STAGGER =====
class ScrollRevealEnhanced {
    constructor() {
        this.sections = document.querySelectorAll('.reveal');
        this.init();
    }

    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');

                    // Animate stagger items
                    const items = entry.target.querySelectorAll('.stagger-item');
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });

                    // Scramble section headings
                    const heading = entry.target.querySelector('.section-heading');
                    if (heading && !heading.dataset.scrambled) {
                        const fx = new TextScramble(heading);
                        fx.setText(heading.innerText);
                        heading.dataset.scrambled = 'true';
                    }
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            observer.observe(section);
        });
    }
}

// ===== SMART NAVIGATION =====
class SmartNavigation {
    constructor() {
        this.nav = document.querySelector('.top-nav');
        this.links = document.querySelectorAll('.nav-links a');
        this.sections = document.querySelectorAll('section[id]');
        this.mobileBtn = document.querySelector('.mobile-menu-btn');
        this.navLinks = document.querySelector('.nav-links');
        this.progressBar = this.createProgressBar();

        this.init();
    }

    createProgressBar() {
        const bar = document.createElement('div');
        bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: linear-gradient(90deg, #8b5cf6, #06b6d4);
            z-index: 1001;
            width: 0%;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(bar);
        return bar;
    }

    init() {
        // Scroll effects
        window.addEventListener('scroll', () => {
            this.handleScroll();
            this.updateActiveLink();
            this.updateProgressBar();
        }, { passive: true });

        // Mobile menu
        if (this.mobileBtn) {
            this.mobileBtn.addEventListener('click', () => {
                this.navLinks.classList.toggle('active');
                this.mobileBtn.classList.toggle('active');
            });
        }

        // Smooth scroll
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    this.navLinks.classList.remove('active');
                    this.mobileBtn.classList.remove('active');
                }
            });
        });
    }

    handleScroll() {
        if (window.scrollY > 50) {
            this.nav.classList.add('scrolled');
        } else {
            this.nav.classList.remove('scrolled');
        }
    }

    updateActiveLink() {
        const scrollPos = window.scrollY + 200;

        this.sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                this.links.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        this.progressBar.style.width = progress + '%';
    }
}

// ===== MAGNETIC EFFECT =====
class MagneticEffect {
    constructor() {
        this.elements = document.querySelectorAll('.hero-socials a, .resume-button, .stat-card');
        if (window.matchMedia('(pointer: coarse)').matches) return;
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => this.handleMouseMove(e, el));
            el.addEventListener('mouseleave', () => this.handleMouseLeave(el));
        });
    }

    handleMouseMove(e, el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
    }

    handleMouseLeave(el) {
        el.style.transform = '';
    }
}

// ===== PARALLAX LAYERS =====
class ParallaxLayers {
    constructor() {
        this.blobs = document.querySelectorAll('.mesh-blob');
        this.hero = document.querySelector('#hero');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            // Parallax for background blobs
            this.blobs.forEach((blob, index) => {
                const speed = 0.1 + (index * 0.05);
                const yPos = -(scrolled * speed);
                blob.style.transform = `translateY(${yPos}px)`;
            });

            // Fade out hero on scroll
            if (this.hero) {
                const opacity = 1 - (scrolled / window.innerHeight);
                this.hero.style.opacity = Math.max(opacity, 0);
            }
        }, { passive: true });
    }
}

// ===== HERO TITLE ANIMATION =====
class HeroTitleAnimation {
    static init() {
        const title = document.querySelector('.mega-title');
        if (!title) return;

        // Store original HTML and split into characters
        const originalHTML = title.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;

        // Process the title to wrap each character
        this.processElement(tempDiv);

        // Replace title content
        title.innerHTML = tempDiv.innerHTML;
        title.classList.add('animated');

        // Add accent animation
        const accent = title.querySelector('.accent');
        if (accent) {
            accent.classList.add('animated');
        }

        // Animate characters with stagger
        const chars = title.querySelectorAll('.char');
        chars.forEach((char, index) => {
            char.style.animationDelay = `${0.5 + index * 0.05}s`;
        });

        // Add hover effect for individual letters after animation
        setTimeout(() => {
            this.addLetterHover(title);
        }, 2000);
    }

    static processElement(element) {
        const childNodes = Array.from(element.childNodes);
        element.innerHTML = '';

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Split text into characters
                const text = node.textContent;
                text.split('').forEach(char => {
                    if (char === ' ') {
                        element.appendChild(document.createTextNode(' '));
                    } else if (char === '\n') {
                        element.appendChild(document.createTextNode('\n'));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'char';
                        span.textContent = char;
                        element.appendChild(span);
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Keep elements (like <br>, <span>) but process their children
                const clone = node.cloneNode(false);
                if (node.childNodes.length > 0) {
                    this.processElement(clone);
                }
                element.appendChild(clone);
            }
        });
    }

    static addLetterHover(title) {
        const chars = title.querySelectorAll('.char');
        chars.forEach(char => {
            char.classList.add('letter');
        });
    }
}

// ===== GLITCH EFFECT ON LOAD =====
class GlitchEffect {
    static init() {
        const title = document.querySelector('.mega-title');
        if (!title || title.classList.contains('animated')) return;

        const originalHTML = title.innerHTML;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let iterations = 0;
        const interval = setInterval(() => {
            title.innerHTML = originalHTML.split('').map((char, index) => {
                if (char === '<' || char === '>' || char === '/' || char === ' ' || char === '\n') {
                    return char;
                }
                if (index < iterations) {
                    return originalHTML[index];
                }
                return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }).join('');

            if (iterations >= originalHTML.length) {
                clearInterval(interval);
                title.innerHTML = originalHTML;
            }

            iterations += 1;
        }, 30);
    }
}

// ===== VIEW-BASED THEMING =====
class ViewBasedTheme {
    constructor() {
        this.body = document.body;
        this.sections = document.querySelectorAll('section[id]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    this.body.setAttribute('data-view', id);

                    // Change blob colors based on section
                    this.updateBlobColors(id);
                }
            });
        }, { threshold: 0.5 });

        this.sections.forEach(section => observer.observe(section));
    }

    updateBlobColors(sectionId) {
        const blobs = document.querySelectorAll('.mesh-blob');
        const colorMap = {
            'hero': ['rgba(139, 92, 246, 0.4)', 'rgba(6, 182, 212, 0.3)'],
            'about': ['rgba(236, 72, 153, 0.3)', 'rgba(139, 92, 246, 0.25)'],
            'experience': ['rgba(59, 130, 246, 0.3)', 'rgba(6, 182, 212, 0.25)'],
            'skills': ['rgba(139, 92, 246, 0.35)', 'rgba(236, 72, 153, 0.2)'],
            'projects': ['rgba(6, 182, 212, 0.35)', 'rgba(59, 130, 246, 0.2)'],
            'education': ['rgba(236, 72, 153, 0.3)', 'rgba(139, 92, 246, 0.2)'],
            'resume': ['rgba(139, 92, 246, 0.4)', 'rgba(6, 182, 212, 0.3)']
        };

        const colors = colorMap[sectionId] || colorMap['hero'];

        blobs.forEach((blob, index) => {
            const color = colors[index % colors.length];
            blob.style.background = `linear-gradient(135deg, ${color}, transparent)`;
        });
    }
}

// ===== INITIALIZE ALL =====
document.addEventListener('DOMContentLoaded', () => {
    // Core systems
    new ParticleNetwork();
    new EnhancedCursor();
    new SmartNavigation();

    // Animations
    new ScrollRevealEnhanced();
    CounterAnimation.init();
    new MagneticEffect();
    new ParallaxLayers();
    new ViewBasedTheme();

    // Initial effects
    HeroTitleAnimation.init();
    TypeWriter.initForHero();
    TextScramble.initHoverEffects();

    // Trigger hero immediately
    setTimeout(() => {
        document.querySelector('#hero')?.classList.add('active');
    }, 100);
});

// Performance: Pause animations when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.body.classList.add('paused');
    } else {
        document.body.classList.remove('paused');
    }
});

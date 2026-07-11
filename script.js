// ============================================
// SCRIPT COMPLETO - PLATAFORMA DIGITAL
// ============================================

// ============================================
// CARROSSEL / BANNER
// ============================================
class Carousel {
    constructor() {
        this.slides = document.querySelectorAll('.carousel-slide');
        this.dots = document.querySelectorAll('.dot');
        this.prevBtn = document.querySelector('.carousel-btn.prev');
        this.nextBtn = document.querySelector('.carousel-btn.next');
        this.currentSlide = 0;
        this.slideInterval = null;
        this.intervalTime = 5000; // 5 segundos
        
        this.init();
    }
    
    init() {
        if (!this.slides.length) return;
        
        // Event listeners
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Dots
        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.getAttribute('data-slide'));
                this.goToSlide(slideIndex);
            });
        });
        
        // Swipe para mobile
        this.initSwipe();
        
        // Auto play
        this.startAutoPlay();
        
        // Pausar ao hover
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
            carousel.addEventListener('mouseleave', () => this.startAutoPlay());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
    }
    
    showSlide(index) {
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));
        
        this.slides[index].classList.add('active');
        this.dots[index].classList.add('active');
        this.currentSlide = index;
    }
    
    nextSlide() {
        const next = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(next);
    }
    
    prevSlide() {
        const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(prev);
    }
    
    goToSlide(index) {
        this.showSlide(index);
        this.resetAutoPlay();
    }
    
    startAutoPlay() {
        this.stopAutoPlay();
        this.slideInterval = setInterval(() => this.nextSlide(), this.intervalTime);
    }
    
    stopAutoPlay() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
    
    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }
    
    initSwipe() {
        const carousel = document.querySelector('.carousel');
        if (!carousel) return;
        
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const diff = startX - endX;
        const threshold = 50; // mínimo de 50px para considerar swipe
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
}

// ============================================
// FAQ - ACCORDION
// ============================================
class FAQ {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }
    
    init() {
        if (!this.faqItems.length) return;
        
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => this.toggleFAQ(item));
            }
        });
    }
    
    toggleFAQ(item) {
        // Fechar outros itens
        this.faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle item atual
        item.classList.toggle('active');
        
        // Scroll suave para o item
        if (item.classList.contains('active')) {
            setTimeout(() => {
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================
class HeaderScroll {
    constructor() {
        this.header = document.querySelector('.header');
        this.lastScroll = 0;
        this.init();
    }
    
    init() {
        if (!this.header) return;
        
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        this.handleScroll(); // Verificar estado inicial
    }
    
    handleScroll() {
        const currentScroll = window.pageYOffset;
        
        // Adicionar classe scrolled
        if (currentScroll > 50) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }
        
        // Esconder/mostrar header ao scroll
        if (currentScroll > this.lastScroll && currentScroll > 200) {
            // Scroll para baixo - esconder
            this.header.style.transform = 'translateY(-100%)';
        } else {
            // Scroll para cima - mostrar
            this.header.style.transform = 'translateY(0)';
        }
        
        this.lastScroll = currentScroll;
    }
}

// ============================================
// MENU MOBILE
// ============================================
class MobileMenu {
    constructor() {
        this.menuBtn = document.querySelector('.menu-mobile');
        this.navMenu = document.querySelector('.nav-menu');
        this.isOpen = false;
        this.init();
    }
    
    init() {
        if (!this.menuBtn || !this.navMenu) return;
        
        this.menuBtn.addEventListener('click', () => this.toggleMenu());
        
        // Fechar menu ao clicar em um link
        const menuLinks = this.navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.navMenu.contains(e.target) && !this.menuBtn.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // Fechar menu ao pressionar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.navMenu.style.display = 'block';
        this.navMenu.style.position = 'absolute';
        this.navMenu.style.top = '100%';
        this.navMenu.style.left = '0';
        this.navMenu.style.right = '0';
        this.navMenu.style.background = 'rgba(15, 15, 26, 0.98)';
        this.navMenu.style.backdropFilter = 'blur(20px)';
        this.navMenu.style.padding = '20px';
        this.navMenu.style.borderBottom = '1px solid rgba(108, 99, 255, 0.2)';
        
        const ul = this.navMenu.querySelector('ul');
        if (ul) {
            ul.style.flexDirection = 'column';
            ul.style.gap = '16px';
        }
        
        this.menuBtn.innerHTML = '<i class="fas fa-times"></i>';
        this.isOpen = true;
    }
    
    closeMenu() {
        this.navMenu.style.display = '';
        this.navMenu.style.position = '';
        this.navMenu.style.top = '';
        this.navMenu.style.left = '';
        this.navMenu.style.right = '';
        this.navMenu.style.background = '';
        this.navMenu.style.backdropFilter = '';
        this.navMenu.style.padding = '';
        this.navMenu.style.borderBottom = '';
        
        const ul = this.navMenu.querySelector('ul');
        if (ul) {
            ul.style.flexDirection = '';
            ul.style.gap = '';
        }
        
        this.menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        this.isOpen = false;
    }
}

// ============================================
// BOTÃO VOLTAR AO TOPO
// ============================================
class ScrollToTop {
    constructor() {
        this.btn = document.querySelector('.float-btn.top');
        this.init();
    }
    
    init() {
        if (!this.btn) return;
        
        // Mostrar/esconder botão
        window.addEventListener('scroll', () => this.toggleVisibility(), { passive: true });
        
        // Click event
        this.btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.scrollToTop();
        });
        
        this.toggleVisibility();
    }
    
    toggleVisibility() {
        if (window.pageYOffset > 500) {
            this.btn.style.opacity = '1';
            this.btn.style.visibility = 'visible';
            this.btn.style.transform = 'translateY(0)';
        } else {
            this.btn.style.opacity = '0';
            this.btn.style.visibility = 'hidden';
            this.btn.style.transform = 'translateY(20px)';
        }
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ============================================
// COOKIE / LGPD BANNER
// ============================================
class CookieConsent {
    constructor() {
        this.banner = document.getElementById('cookieBanner');
        this.cookieName = 'cookie_consent';
        this.init();
    }
    
    init() {
        if (!this.banner) return;
        
        // Verificar se já aceitou
        if (!this.hasConsent()) {
            setTimeout(() => {
                this.banner.classList.add('show');
            }, 1000);
        }
    }
    
    hasConsent() {
        return localStorage.getItem(this.cookieName) !== null;
    }
    
    accept() {
        localStorage.setItem(this.cookieName, 'accepted');
        localStorage.setItem('cookie_date', new Date().toISOString());
        this.hideBanner();
        this.showToast('Cookies aceitos! Obrigado pela confiança.');
    }
    
    decline() {
        localStorage.setItem(this.cookieName, 'declined');
        this.hideBanner();
        this.showToast('Cookies recusados. Algumas funcionalidades podem não estar disponíveis.');
    }
    
    hideBanner() {
        this.banner.classList.remove('show');
        setTimeout(() => {
            this.banner.style.display = 'none';
        }, 500);
    }
    
    showToast(message) {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: var(--primary);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 500;
            z-index: 10000;
            animation: slideUp 0.5s ease, fadeOut 0.5s ease 3s forwards;
            box-shadow: 0 10px 30px rgba(108, 99, 255, 0.3);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
}

// ============================================
// FUNÇÕES GLOBAIS PARA COOKIES
// ============================================
function aceitarCookies() {
    if (window.cookieConsent) {
        window.cookieConsent.accept();
    }
}

function recusarCookies() {
    if (window.cookieConsent) {
        window.cookieConsent.decline();
    }
}

// ============================================
// SMOOTH SCROLL PARA LINKS INTERNOS
// ============================================
class SmoothScroll {
    constructor() {
        this.init();
    }
    
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    this.scrollTo(target);
                }
            });
        });
    }
    
    scrollTo(target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ============================================
// ANIMAÇÃO DE ENTRADA DOS ELEMENTOS (SCROLL REVEAL)
// ============================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll(
            '.servico-card, .plano-card, .avaliacao-card, .faq-item, .parceiro-item'
        );
        this.init();
    }
    
    init() {
        if (!this.elements.length) return;
        
        // Adicionar classe inicial
        this.elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        
        // Observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        this.elements.forEach(el => observer.observe(el));
    }
}

// ============================================
// CONTADOR DE VISITAS (SIMULADO)
// ============================================
class VisitCounter {
    constructor() {
        this.init();
    }
    
    init() {
        // Simular contador de visitas
        const visits = this.getVisits();
        this.updateVisits(visits + 1);
    }
    
    getVisits() {
        const today = new Date().toDateString();
        const visitData = JSON.parse(localStorage.getItem('visit_data') || '{}');
        
        if (visitData.date !== today) {
            return 0;
        }
        
        return visitData.count || 0;
    }
    
    updateVisits(count) {
        const today = new Date().toDateString();
        localStorage.setItem('visit_data', JSON.stringify({
            date: today,
            count: count
        }));
    }
}

// ============================================
// DETECÇÃO DE DISPOSITIVO
// ============================================
class DeviceDetector {
    constructor() {
        this.isMobile = this.checkMobile();
        this.isTablet = this.checkTablet();
        this.isDesktop = !this.isMobile && !this.isTablet;
        this.init();
    }
    
    init() {
        // Adicionar classe no body
        if (this.isMobile) {
            document.body.classList.add('device-mobile');
        } else if (this.isTablet) {
            document.body.classList.add('device-tablet');
        } else {
            document.body.classList.add('device-desktop');
        }
    }
    
    checkMobile() {
        return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    checkTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    }
}

// ============================================
// LAZY LOADING PARA IMAGENS
// ============================================
class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('img[data-src]');
        this.init();
    }
    
    init() {
        if (!this.images.length) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                        img.addEventListener('load', () => {
                            img.classList.add('loaded');
                        });
                        observer.unobserve(img);
                    }
                });
            },
            {
                rootMargin: '50px 0px'
            }
        );
        
        this.images.forEach(img => observer.observe(img));
    }
}

// ============================================
// VALIDAÇÃO DE FORMULÁRIOS (UTILITÁRIO)
// ============================================
class FormValidator {
    constructor() {
        this.validators = {
            required: (value) => value.trim().length > 0,
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value.replace(/\s/g, '')),
            cpf: (value) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value),
            password: (value) => value.length >= 6,
            match: (value, matchValue) => value === matchValue
        };
    }
    
    validate(field, rules) {
        const value = field.value;
        const errors = [];
        
        for (const rule of rules) {
            if (rule.name === 'match') {
                const matchField = document.querySelector(rule.selector);
                if (matchField && !this.validators.match(value, matchField.value)) {
                    errors.push(rule.message || 'Os valores não conferem');
                }
            } else if (this.validators[rule.name]) {
                if (!this.validators[rule.name](value)) {
                    errors.push(rule.message || `Campo ${rule.name} inválido`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    showError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        // Remover erro anterior
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Adicionar novo erro
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            color: var(--danger);
            font-size: 0.85rem;
            margin-top: 4px;
            display: block;
        `;
        
        formGroup.appendChild(errorEl);
        field.classList.add('error');
    }
    
    clearError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        const error = formGroup.querySelector('.error-message');
        if (error) error.remove();
        
        field.classList.remove('error');
    }
}

// ============================================
// MÁSCARA PARA INPUTS
// ============================================
class InputMask {
    constructor() {
        this.masks = {
            phone: '(99) 99999-9999',
            cpf: '999.999.999-99',
            cep: '99999-999',
            date: '99/99/9999'
        };
    }
    
    apply(input, maskType) {
        const mask = this.masks[maskType];
        if (!mask) return;
        
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            let maskedValue = '';
            let valueIndex = 0;
            
            for (let i = 0; i < mask.length; i++) {
                if (valueIndex >= value.length) break;
                
                if (mask[i] === '9') {
                    maskedValue += value[valueIndex];
                    valueIndex++;
                } else {
                    maskedValue += mask[i];
                }
            }
            
            e.target.value = maskedValue;
        });
    }
}

// ============================================
// NOTIFICAÇÕES / TOASTS
// ============================================
class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }
    
    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    
    show(message, type = 'info', duration = 4000) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            max-width: 450px;
        `;
        
        toast.innerHTML = `
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
class KeyboardShortcuts {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // ESC para fechar modais
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    focusSearch() {
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
}

// ============================================
// INICIALIZAÇÃO DE TODOS OS COMPONENTES
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Plataforma Digital Inicializada');
    
    // Inicializar todos os componentes
    window.carousel = new Carousel();
    window.faq = new FAQ();
    window.headerScroll = new HeaderScroll();
    window.mobileMenu = new MobileMenu();
    window.scrollToTop = new ScrollToTop();
    window.cookieConsent = new CookieConsent();
    window.smoothScroll = new SmoothScroll();
    window.scrollReveal = new ScrollReveal();
    window.visitCounter = new VisitCounter();
    window.deviceDetector = new DeviceDetector();
    window.lazyLoader = new LazyLoader();
    window.formValidator = new FormValidator();
    window.inputMask = new InputMask();
    window.toastNotification = new ToastNotification();
    window.keyboardShortcuts = new KeyboardShortcuts();
    
    // Log de inicialização
    console.log('✅ Todos os componentes carregados com sucesso!');
    console.log('📱 Dispositivo:', 
        window.deviceDetector.isMobile ? 'Mobile' : 
        window.deviceDetector.isTablet ? 'Tablet' : 'Desktop'
    );
});

// ============================================
// PREVENIR COMPORTAMENTOS INDESEJADOS
// ============================================

// Prevenir arrastar imagens
document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Prevenir clique direito em imagens (opcional)
// document.addEventListener('contextmenu', (e) => {
//     if (e.target.tagName === 'IMG') {
//         e.preventDefault();
//     }
// });

// ============================================
// SERVICE WORKER REGISTRATION (PWA - OPCIONAL)
// ============================================
if ('serviceWorker' in navigator) {
    // Descomentar para ativar PWA
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //         .then(registration => {
    //             console.log('Service Worker registrado:', registration.scope);
    //         })
    //         .catch(error => {
    //             console.log('Service Worker falhou:', error);
    //         });
    // });
}

// ============================================
// EXPORTAR PARA USO GLOBAL
// ============================================
window.Plataforma = {
    Carousel,
    FAQ,
    HeaderScroll,
    MobileMenu,
    ScrollToTop,
    CookieConsent,
    SmoothScroll,
    ScrollReveal,
    VisitCounter,
    DeviceDetector,
    LazyLoader,
    FormValidator,
    InputMask,
    ToastNotification,
    KeyboardShortcuts
};

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    //  Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
   
    const swiper = new Swiper(".portfolioSwiper", {
        slidesPerView: 1,      // 1 columna en móviles
        grid: {
            rows: 3,           // 2 filas
            fill: 'row'
        },
        spaceBetween: 30,      // Espacio entre carpetas
        autoplay: {
            delay: 8000,
            disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            // Cuando la pantalla es >= 768px (Tablets)
            768: {
                slidesPerView: 2,
                grid: { rows: 2 }
            },
            // Cuando la pantalla es >= 1200px (Desktop)
            1200: {
                slidesPerView: 3, // 3 columnas visibles
                grid: { rows: 2 }
            }
        },
        // Habilitar movimiento táctil
        grabCursor: true,
        mousewheel: false,
    }); 

    // Función para animar imágenes al hacer scroll
    const revealOnScroll = function() {
        const images = document.querySelectorAll('.reveal-img');
        const windowHeight = window.innerHeight;

        images.forEach(img => {
            const objectTop = img.getBoundingClientRect().top;
            // Si el objeto está a 150px del borde inferior de la pantalla
            if (objectTop < windowHeight - 150) {
                img.classList.add('is-visible');
            }
        });
    };

    // Ejecutar al cargar y al hacer scroll
    revealOnScroll();
    window.addEventListener('scroll', revealOnScroll);

    const fabMain = document.getElementById('fabMain');
    const fabOptions = document.getElementById('fabOptions');
    const fabIcon = document.getElementById('fabIcon');

    if (fabMain) {
        fabMain.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Toggle de visibilidad
            if (fabOptions.style.display === 'none' || fabOptions.style.display === '') {
                fabOptions.style.display = 'flex';
                fabIcon.style.transform = 'rotate(45deg)';
            } else {
                fabOptions.style.display = 'none';
                fabIcon.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Cerrar si hacen clic fuera
    document.addEventListener('click', function() {
        fabOptions.style.display = 'none';
        fabIcon.style.transform = 'rotate(0deg)';
    });

});

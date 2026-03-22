/*=============== SHOW MENU ===============*/
const navmenu = document.getElementById('nav-menu'),
  navToggle = document.getElementById('nav-toggle'),
  navClose = document.getElementById('nav-close');



/*===== Menu Show =====*/
/* Validate if constant exists */
if(navToggle) {
  navToggle.addEventListener('click', () => {
    navmenu.classList.add('show-menu');
  }) 
}

/*===== Hide Show =====*/
/* Validate if constant exists */
if(navClose) {
  navClose.addEventListener('click', () => {
    navmenu.classList.remove('show-menu');
  }) 
}



/*=============== IMAGE GALLERY ===============*/
function imgGallery() {
  const mainImg = document.querySelector('.details__img'),
  smallImg = document.querySelectorAll('.details__small-img');

  smallImg.forEach((img)  => {
    img.addEventListener('click', function() {
      mainImg.src = this.src;
    })
  })
}

imgGallery();



/*=============== SWIPER CATEGORIES ===============*/
var swipercategories = new Swiper('.categories__container', {
    spaceBetween: 24,
    loop:true,

    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

    breakpoints: {
        350: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
        768: {
          slidesPerView: 3,
          spaceBetween: 24,
        },
        992: {
          slidesPerView: 4,
          spaceBetween: 24,
        },
        1200: {
          slidesPerView: 5,
          spaceBetween: 24,
        },
        1400: {
          slidesPerView: 5,
          spaceBetween: 22,
        },
      },
  });
/*=============== SWIPER PRODUCTS ===============*/
var swiperproducts = new Swiper('.new__container', {
  spaceBetween: 24,
  loop:true,

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 24,
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 24,
      },
      1400: {
        slidesPerView: 6,
        spaceBetween: 24,
      },
    },
});


/*=============== PRODUCTS TABS ===============*/
/*=============== PRODUCTS TABS ===============*/
const tabs = document.querySelectorAll('[data-target]'), 
  tabcontents = document.querySelectorAll('[content]');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = document.querySelector(tab.dataset.target);
    
    // Remove active class from all tab contents
    tabcontents.forEach((tabcontent) => {
      tabcontent.classList.remove('active-tab');
    });

    // Add active class to the clicked tab's content
    target.classList.add('active-tab');

    // Remove active class from all tabs (if needed)
    tabs.forEach((t) => {
      t.classList.remove('active-tab');
    });

    // Add active class to the clicked tab (optional)
    tab.classList.add('active-tab');
  });
});


// active page like home,shop cart etc
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav__link");
  const currentPage = location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const linkPage = href.split("/").pop();

    // remove old active
    link.classList.remove("active-link");

    // match exact page
    if (linkPage === currentPage) {
      link.classList.add("active-link");
    }

    // bonus: if you're on index page and href is "/" or empty
    if (currentPage === "" && (linkPage === "index.html" || href === "/")) {
      link.classList.add("active-link");
    }
  });
});

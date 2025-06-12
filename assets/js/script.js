'use strict';

// element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
});

// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
};

// add click event to all modal items
testimonialsItem.forEach(item => {
  item.addEventListener("click", function () {
    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();
  });
});

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);

// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () {
  elementToggleFunc(this);
});

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

// ✅ Updated filter function to support comma-separated values
const filterFunc = function (selectedValue) {
  filterItems.forEach(item => {
    const categories = item.dataset.category
      .toLowerCase()
      .split(',')
      .map(cat => cat.trim());

    const matches = selectedValue === "all" || categories.includes(selectedValue);

    item.classList.toggle("active", matches);
  });
};

// add event in all select items
selectItems.forEach(item => {
  item.addEventListener("click", function () {
    const selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
});

// ✅ Updated large screen filter button functionality
let lastClickedBtn = filterBtn[0];

filterBtn.forEach(btn => {
  btn.addEventListener("click", function () {
    const selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;
  });
});

// show blog section if URL has #blog
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash === "#blog") {
    showSection("blog");
  }
});

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.querySelector(`[data-section="${sectionId}"]`)?.classList.add("active");
}

// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add input event to all form inputs
formInputs.forEach(input => {
  input.addEventListener("input", function () {
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
});

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add click event to all nav links
navigationLinks.forEach((link, index) => {
  link.addEventListener("click", function () {
    pages.forEach((page, i) => {
      const isActive = link.innerHTML.toLowerCase() === page.dataset.page;
      page.classList.toggle("active", isActive);
      navigationLinks[i].classList.toggle("active", isActive);
    });
    window.scrollTo(0, 0);
  });
});

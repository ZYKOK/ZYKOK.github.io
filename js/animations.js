// Observe each element
const animatedElements = document.querySelectorAll(".gs_reveal");

document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(".gs_reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        } else {
          entry.target.classList.remove("active"); // remove if you want it to disappear
        }
      });
    },
    { threshold: 0.1 } // triggers when 10% of element is visible
  );

  animatedElements.forEach(el => observer.observe(el));
});

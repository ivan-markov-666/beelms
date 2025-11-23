(function () {
  // Navigation helper for Sandbox UI pages.
  // Many sidebar links still point to prototype filenames like "04-sandbox-textbox.html".
  // This script normalizes them to the actual sandbox-*.html files so that navigation works.

  function mapSandboxHref(href) {
    if (!href) return href;

    // Remove numeric prefix if present, e.g. "04-sandbox-textbox.html" -> "sandbox-textbox.html".
    var normalized = href.replace(/^\d+-/, "");

    // Special cases where the real file has sandbox-* prefix but the link does not.
    if (normalized === "table-crud.html") {
      return "sandbox-table-crud.html";
    }
    if (normalized === "complex-form.html") {
      return "sandbox-complex-form.html";
    }

    return normalized;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector("aside nav");
    if (!nav) return;

    // Highlight the active Sandbox link based on data-page on the <body>.
    var body = document.body;
    var currentPage = (body && body.getAttribute("data-page")) || "";
    if (currentPage) {
      var links = nav.querySelectorAll("a[href]");
      links.forEach(function (link) {
        var href = link.getAttribute("href");
        if (!href) return;

        var target = mapSandboxHref(href);
        var targetPage = target.replace(/\.html(?:\?.*)?$/, "");

        if (targetPage === currentPage) {
          // Add active styling similar to the manually highlighted link in the HTML.
          link.classList.add("bg-green-50", "text-green-700", "font-medium");
        }
      });
    }

    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;

      var href = link.getAttribute("href");
      if (!href) return;

      var target = mapSandboxHref(href);

      // If mapping does not change the href, let the browser handle it.
      if (target === href) {
        return;
      }

      event.preventDefault();
      window.location.href = target;
    });
  });
})();

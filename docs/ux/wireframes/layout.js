(function () {
  function getLayoutConfig() {
    var body = document.body;
    if (!body) {
      return { layout: "public", page: "" };
    }
    return {
      layout: body.getAttribute("data-layout") || "public",
      page: body.getAttribute("data-page") || "",
    };
  }

  function getBasePath() {
    var script = document.currentScript;
    if (!script) {
      var scripts = document.getElementsByTagName("script");
      if (scripts.length) {
        script = scripts[scripts.length - 1];
      }
    }

    if (!script) {
      return "./";
    }

    var src = script.getAttribute("src") || "";
    var lastSlashIndex = src.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      return "./";
    }

    return src.substring(0, lastSlashIndex + 1);
  }

  var basePath = getBasePath();

  function getNavLinkClass(page, section) {
    var base = "text-gray-700 hover:text-green-600 transition";
    var active = "text-green-600 font-semibold border-b-2 border-green-600 pb-1";
    var isActive = false;

    if (section === "wiki") {
      if (page === "wiki-list" || page === "wiki-article") {
        isActive = true;
      }
    } else if (section === "practical") {
      if (
        page === "sandbox-textbox" ||
        page === "table-crud" ||
        page === "complex-form" ||
        page.indexOf("sandbox-") === 0
      ) {
        isActive = true;
      }
    } else if (section === "training") {
      if (page === "training-api") {
        isActive = true;
      }
    }

    return isActive ? active : base;
  }

  function getAuthLinkClass(page, target) {
    var base = "text-gray-700 hover:text-green-600 transition";
    if (page === target) {
      return "text-green-600 font-semibold";
    }
    return base;
  }

  function publicHeaderHtml(page) {
    var wikiClass = getNavLinkClass(page, "wiki");
    var practicalClass = getNavLinkClass(page, "practical");
    var trainingClass = getNavLinkClass(page, "training");
    var loginClass = getAuthLinkClass(page, "login");
    var registerClass = getAuthLinkClass(page, "register");

    return (
      '<header class="bg-white border-b border-gray-200 h-20">' +
      '  <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">' +
      '    <div class="flex items-center">' +
      '      <a href="' +
      basePath +
      'Home-Landing/home.html" class="text-2xl font-bold text-green-600">QA4Free</a>' +
      "    </div>" +
      '    <nav class="hidden md:flex space-x-6">' +
      '      <a href="' +
      basePath +
      'WikiScreens/wiki-list.html" class="' +
      wikiClass +
      '">Wiki</a>' +
      '      <a href="' +
      basePath +
      'Sandbox/sandbox-textbox.html" class="' +
      practicalClass +
      '">Practical UI</a>' +
      '      <a href="' +
      basePath +
      'Sandbox/sandbox-training-api.html" class="' +
      trainingClass +
      '">Training API</a>' +
      "    </nav>" +
      '    <div class="flex items-center space-x-4">' +
      '      <a href="' +
      basePath +
      'AuthenticationScreens/login.html" class="' +
      loginClass +
      '">Login</a>' +
      '      <a href="' +
      basePath +
      'AuthenticationScreens/register.html" class="' +
      registerClass +
      '">Register</a>' +
      '      <select class="border border-gray-300 rounded px-2 py-1 text-sm">' +
      "        <option>EN</option>" +
      "        <option>DE</option>" +
      "        <option>BG</option>" +
      "      </select>" +
      "    </div>" +
      '    <button class="md:hidden">' +
      '      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>' +
      "      </svg>" +
      "    </button>" +
      "  </div>" +
      "</header>"
    );
  }

  function adminHeaderHtml(page) {
    var isAdmin = page.indexOf("admin") === 0 || page === "admin";
    var adminLinkClass = isAdmin
      ? "text-green-600 font-semibold border-b-2 border-green-600 pb-1"
      : "text-gray-700 hover:text-green-600 transition";

    return (
      '<header class="bg-white border-b border-gray-200 h-20">' +
      '  <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">' +
      '    <div class="flex items-center">' +
      '      <a href="' +
      basePath +
      'Home-Landing/home.html" class="text-2xl font-bold text-green-600">QA4Free</a>' +
      "    </div>" +
      '    <nav class="hidden md:flex space-x-6">' +
      '      <a href="' +
      basePath +
      'WikiScreens/wiki-list.html" class="text-gray-700 hover:text-green-600 transition">Wiki</a>' +
      '      <a href="' +
      basePath +
      'Sandbox/sandbox-textbox.html" class="text-gray-700 hover:text-green-600 transition">Practical UI</a>' +
      '      <a href="' +
      basePath +
      'Sandbox/sandbox-training-api.html" class="text-gray-700 hover:text-green-600 transition">Training API</a>' +
      '      <a href="' +
      basePath +
      'AdminScreens/admin-dashboard.html" class="' +
      adminLinkClass +
      '">Admin</a>' +
      "    </nav>" +
      '    <div class="flex items-center space-x-4">' +
      '      <span class="text-gray-700">admin@example.com</span>' +
      '      <select class="border border-gray-300 rounded px-2 py-1 text-sm">' +
      "        <option>EN</option>" +
      "        <option>DE</option>" +
      "        <option>BG</option>" +
      "      </select>" +
      "    </div>" +
      '    <button class="md:hidden">' +
      '      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>' +
      "      </svg>" +
      "    </button>" +
      "  </div>" +
      "</header>"
    );
  }

  function footerHtml() {
    return (
      '<footer class="bg-white border-t border-gray-200 py-6 mt-12">' +
      '  <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">' +
      '    <a href="' +
      basePath +
      'Others/about.html" class="hover:text-green-600">About</a>' +
      '    <span class="mx-2">|</span>' +
      '    <a href="' +
      basePath +
      'Others/privacy-gdpr.html" class="hover:text-green-600">Privacy/GDPR</a>' +
      '    <span class="mx-2">|</span>' +
      '    <a href="' +
      basePath +
      'Others/contact.html" class="hover:text-green-600">Contact</a>' +
      "  </div>" +
      "</footer>"
    );
  }

  function renderLayout() {
    var config = getLayoutConfig();
    var headerContainer = document.getElementById("site-header");
    if (headerContainer) {
      headerContainer.innerHTML =
        config.layout === "admin"
          ? adminHeaderHtml(config.page)
          : publicHeaderHtml(config.page);
    }

    var footerContainer = document.getElementById("site-footer");
    if (footerContainer) {
      footerContainer.innerHTML = footerHtml();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderLayout);
  } else {
    renderLayout();
  }
})();

(function () {
  // Navigation helper for Sandbox UI pages.
  // Many sidebar links still point to prototype filenames like "04-sandbox-textbox.html".
  // This script normalizes them to the actual sandbox-*.html files so that navigation works.
  function getCurrentPageKey() {
    var body = document.body;
    if (!body) return '';
    return body.getAttribute('data-page') || '';
  }

  function getSandboxItems() {
    return [
      { page: 'sandbox-textbox', href: 'sandbox-textbox.html', label: 'Text Box' },
      { page: 'sandbox-checkbox-radio', href: 'sandbox-checkbox-radio.html', label: 'Check Box &amp; Radio' },
      { page: 'sandbox-buttons', href: 'sandbox-buttons.html', label: 'Buttons' },
      { page: 'sandbox-links', href: 'sandbox-links.html', label: 'Links' },
      { page: 'sandbox-alerts', href: 'sandbox-alerts.html', label: 'Alerts' },
      { page: 'sandbox-modals', href: 'sandbox-modals.html', label: 'Modal Dialogs' },
      { page: 'sandbox-upload-download', href: 'sandbox-upload-download.html', label: 'Upload / Download' },
      { page: 'sandbox-date-picker', href: 'sandbox-date-picker.html', label: 'Date Picker' },
      { page: 'sandbox-tabs', href: 'sandbox-tabs.html', label: 'Tabs' },
      { page: 'sandbox-select-menu', href: 'sandbox-select-menu.html', label: 'Select Menu' },
      { page: 'sandbox-accordion', href: 'sandbox-accordion.html', label: 'Accordion' },
      { page: 'sandbox-slider', href: 'sandbox-slider.html', label: 'Slider' },
      { page: 'sandbox-tooltips', href: 'sandbox-tooltips.html', label: 'Tooltips' },
      { page: 'sandbox-autocomplete', href: 'sandbox-autocomplete.html', label: 'Auto Complete' },
      { page: 'sandbox-progress', href: 'sandbox-progress.html', label: 'Progress Bar' },
      { page: 'sandbox-frames', href: 'sandbox-frames.html', label: 'Frames / Windows' },
      { page: 'sandbox-dynamic-properties', href: 'sandbox-dynamic-properties.html', label: 'Dynamic Properties' },
      { page: 'sandbox-nested-frames', href: 'sandbox-nested-frames.html', label: 'Nested Frames' },
      { page: 'sandbox-menu', href: 'sandbox-menu.html', label: 'Menu' },
      { page: 'sandbox-sortable', href: 'sandbox-sortable.html', label: 'Sortable' },
      { page: 'sandbox-selectable', href: 'sandbox-selectable.html', label: 'Selectable' },
      { page: 'sandbox-resizable', href: 'sandbox-resizable.html', label: 'Resizable' },
      { page: 'sandbox-droppable', href: 'sandbox-droppable.html', label: 'Droppable' },
      { page: 'sandbox-draggable', href: 'sandbox-draggable.html', label: 'Draggable' },
      { page: 'complex-form', href: 'sandbox-complex-form.html', label: 'Complex Form' },
      { page: 'table-crud', href: 'sandbox-table-crud.html', label: 'Table CRUD' }
    ];
  }

  function getLinkClass(pageKey, currentPage) {
    var base = 'block px-3 py-2 ';
    if (pageKey === currentPage) {
      return base + 'bg-green-50 text-green-700 rounded-lg font-medium';
    }
    return base + 'text-gray-700 hover:bg-gray-50 rounded-lg';
  }

  function buildSidebarHtml(currentPage) {
    var items = getSandboxItems();
    var linksHtml = items
      .map(function (item) {
        return (
          '                        <a href="' +
          item.href +
          '" class="' +
          getLinkClass(item.page, currentPage) +
          '">' +
          item.label +
          '</a>'
        );
      })
      .join('\n');

    var html = '';
    html += '                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">\n';
    html += '                        <h3 class="font-bold text-gray-900 mb-4">UI Elements</h3>\n';
    html += '                        <nav class="space-y-1">\n';
    html += linksHtml + '\n';
    html += '                        </nav>\n';
    html += '                    </div>\n';
    return html;
  }

  function findSandboxAside() {
    var explicit = document.querySelector('[data-sandbox-nav]');
    if (explicit) {
      return explicit;
    }

    var asides = document.querySelectorAll('aside');
    for (var i = 0; i < asides.length; i++) {
      var aside = asides[i];
      var heading = aside.querySelector('h3');
      if (!heading) continue;
      var text = (heading.textContent || heading.innerText || '').trim();
      if (text === 'UI Elements') {
        return aside;
      }
    }
    return null;
  }

  function renderSandboxSidebar() {
    var container = findSandboxAside();
    if (!container) return;
    var currentPage = getCurrentPageKey();
    container.innerHTML = buildSidebarHtml(currentPage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSandboxSidebar);
  } else {
    renderSandboxSidebar();
  }
})();

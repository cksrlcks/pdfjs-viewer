"use strict";

if (!String.prototype.repeat) {
  String.prototype.repeat = function (count) {
    'use strict';

    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }

    var str = '' + this;
    count = +count;

    if (count != count) {
      count = 0;
    }

    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }

    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }

    count = Math.floor(count);

    if (str.length == 0 || count == 0) {
      return '';
    } // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:


    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }

    var maxCount = str.length * count;
    count = Math.floor(Math.log(count) / Math.log(2));

    while (count) {
      str += str;
      count--;
    }

    str += str.substring(0, maxCount - str.length);
    return str;
  };
}

(function () {
  var currentPageIndex = 0;
  var pageMode = 1; //나중에 두장씩보기, 세장씩보기를 위해 추가

  var cursorIndex = Math.floor(currentPageIndex / pageMode);
  var pdfInstance = null;
  var totalPagesCount = 0;
  var pdfScale = 1;
  var pdfScreen = document.querySelector('#pdf-view');

  window.initUxisViewer = function (url) {
    var loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise.then(function (pdf) {
      pdfInstance = pdf;
      totalPagesCount = pdf.numPages;
      initZoom();
      inintDownload(url);
      initCounter();
      initPager();
      render();
    });
  };

  function initZoom() {
    var zoomInButton = document.querySelector('#zoominbutton');
    var zoomOutButton = document.querySelector('#zoomoutbutton');
    var zoomResetButton = document.querySelector('#zoomresetbutton');
    zoomInButton.addEventListener('click', function () {
      if (pdfScale >= 2) {
        return;
      }

      pdfScale += 0.25;
      render(pdfScale);
    });
    zoomOutButton.addEventListener('click', function () {
      if (pdfScale < 0.75) {
        return;
      }

      pdfScale -= 0.25;
      render(pdfScale);
    });
    zoomResetButton.addEventListener('click', function () {
      pdfScale = 1;
      render(pdfScale);
    });
  }

  function inintDownload(url) {
    var download_button = document.querySelector('.buttons .download');
    download_button.setAttribute('href', url);
  }

  function setCurrentCount() {
    var current_box = document.querySelector('.count .current');
    current_box.innerHTML = currentPageIndex + 1;
  }

  function initCounter() {
    var total_box = document.querySelector('.count .total');
    total_box.innerHTML = totalPagesCount;
    setCurrentCount();
  }

  function pagerAction(e) {
    var action = e.target.getAttribute("data-pager");

    if (action === "prev") {
      if (currentPageIndex === 0) {
        return;
      }

      currentPageIndex -= pageMode;

      if (currentPageIndex < 0) {
        currentPageIndex = 0;
      }

      render();
    }

    if (action === "next") {
      if (currentPageIndex === totalPagesCount - 1) {
        return;
      }

      currentPageIndex += pageMode;

      if (currentPageIndex > totalPagesCount - 1) {
        currentPageIndex = totalPagesCount - 1;
      }

      render();
    }
  }

  function initPager() {
    var pager = document.querySelector("#pdf-pager");
    pager.addEventListener("click", pagerAction);
  }

  function render(scale) {
    cursorIndex = Math.floor(currentPageIndex / pageMode);
    var startPageIndex = cursorIndex;
    var endPageIndex = startPageIndex + pageMode < totalPagesCount ? startPageIndex + pageMode - 1 : totalPagesCount - 1;
    var renderPagesPromises = []; //pdfjs getPage api

    for (var i = startPageIndex; i <= endPageIndex; i++) {
      renderPagesPromises.push(pdfInstance.getPage(i + 1));
    }

    Promise.all(renderPagesPromises).then(function (pages) {
      var pagesHTML = "<div style=\"width=100%\"><canvas></canvas></div>".repeat(pages.length);
      pdfScreen.innerHTML = pagesHTML;
      pages.forEach(function (page) {
        return renderPage(scale, page);
      });
    });
    setCurrentCount();
  }

  function renderPage(scale, page) {
    var pdfViewport = page.getViewport({
      scale: scale
    });
    var container = pdfScreen.children[page.pageIndex - cursorIndex]; // let pdfScale = scale ? container.offsetWidth / pdfViewport.width * scale : container.offsetWidth / pdfViewport.width;

    pdfViewport = page.getViewport({
      scale: scale
    });
    var canvas = document.querySelector('canvas');
    var context = canvas.getContext("2d");
    canvas.height = pdfViewport.height;
    canvas.width = pdfViewport.width;
    page.render({
      canvasContext: context,
      viewport: pdfViewport
    });
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
          args = arguments;

      var later = function later() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  ; // 디바운스 설정

  window.addEventListener('resize', debounce(function () {
    return render(pdfScale);
  }, 150));
})();
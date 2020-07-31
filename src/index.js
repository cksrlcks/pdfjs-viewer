(function () {
  var pdfDoc = null;
  var pageNum = 1;
  var totalPageNum = null;
  var pageRendering = false;
  var pageNumPending = null;
  var scale = 1;
  var pdfContainer = document.querySelector("#pdf-view");
  var canvas = null;

  window.initUxisViewer = function (url) {
    pdfjsLib.getDocument(url).promise.then(function (pdf) {
      pdfDoc = pdf;
      totalPageNum = pdf.numPages;
      document.querySelector(".total").innerHTML = totalPageNum;
      //initZoom();
      //inintDownload(url);
      //initCounter();
      //initPager();
      //renderPage(pageNum);
      drawCanvas();
      renderPage(pageNum);
    });
  };

  // function initZoom() {
  //   const zoomInButton = document.querySelector("#zoominbutton");
  //   const zoomOutButton = document.querySelector("#zoomoutbutton");
  //   const zoomResetButton = document.querySelector("#zoomresetbutton");

  //   zoomInButton.addEventListener("click", function () {
  //     if (pdfScale >= 2) {
  //       return;
  //     }

  //     pdfScale += 0.25;
  //     render(pdfScale);
  //   });

  //   zoomOutButton.addEventListener("click", function () {
  //     if (pdfScale < 0.75) {
  //       return;
  //     }

  //     pdfScale -= 0.25;
  //     render(pdfScale);
  //   });

  //   zoomResetButton.addEventListener("click", function () {
  //     pdfScale = 1;
  //     render(pdfScale);
  //   });
  // }

  // function inintDownload(url) {
  //   const download_button = document.querySelector(".buttons .download");
  //   download_button.setAttribute("href", url);
  // }

  // function setCurrentCount() {
  //   const current_box = document.querySelector(".count .current");
  //   current_box.innerHTML = currentPageIndex + 1;
  // }

  // function initCounter() {
  //   const total_box = document.querySelector(".count .total");

  //   total_box.innerHTML = totalPagesCount;
  //   setCurrentCount();
  // }

  // function pagerAction(e) {
  //   const action = e.target.getAttribute("data-pager");
  //   if (action === "prev") {
  //     if (currentPageIndex === 0) {
  //       return;
  //     }
  //     currentPageIndex -= pageMode;
  //     if (currentPageIndex < 0) {
  //       currentPageIndex = 0;
  //     }
  //     render();
  //   }
  //   if (action === "next") {
  //     if (currentPageIndex === totalPagesCount - 1) {
  //       return;
  //     }
  //     currentPageIndex += pageMode;
  //     if (currentPageIndex > totalPagesCount - 1) {
  //       currentPageIndex = totalPagesCount - 1;
  //     }
  //     render();
  //   }
  // }

  // function initPager() {
  //   const pager = document.querySelector("#pdf-pager");
  //   pager.addEventListener("click", pagerAction);
  // }

  function drawCanvas() {
    const pagesHTML = `<div style="width=100%" class="canvas-container"><canvas id="pdf-canvas"></canvas></div>`;
    pdfContainer.innerHTML = pagesHTML;
    canvas = document.querySelector("#pdf-canvas");
  }

  function renderPage(pageNum) {
    pageRendering = true;

    pdfDoc.getPage(pageNum).then(function (page) {
      scale = pdfContainer.children[0].offsetWidth / page.getViewport({ scale: 1 }).width;

      var viewport = page.getViewport({ scale: scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderContext = {
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
      };

      var renderTask = page.render(renderContext);

      renderTask.promise.then(function () {
        pageRendering = false;
        if (pageNumPending !== null) {
          renderPage(pageNumPending);
          pageNumPending = null;
        }
      });

      document.querySelector(".current").innerHTML = pageNum;
    });
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  } // 디바운스 설정

  window.addEventListener(
    "resize",
    debounce(() => renderPage(pageNum), 150)
  );
})();

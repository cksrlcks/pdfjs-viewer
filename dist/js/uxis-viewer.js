"use strict"; //ie forEach polyfill

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;

    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
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

var UxisViewer = function UxisViewer(options) {
  this.url = options.url;
  this.mode = options.mode || "one";
  this.target = document.querySelector(options.target);
  this.pdfDoc = null;
  this.pageNum = 1;
  this.currentPageNum = 1;
  this.totalPageNum = null;
  this.pageRendering = false;
  this.pageNumPending = null;
  this.scale = 1;
  this.canvas = null;
  this.viewport = null;
  this.PDFJS = PDFJS;
  this.zoom_in_scale = null;
  this.toolBarColor = options.color || "#3d464d";
  this.scroll = false;

  this.scroll_browser_check = function () {
    var agent = navigator.userAgent.toLowerCase();

    if (agent.indexOf("chrome") != -1 || agent.indexOf("msie") != -1 || agent.indexOf("edge") != -1) {
      this.scroll = true;
    }
  };

  this.update_pager = function () {
    var current = this.currentPageNum;
    this.target.querySelector(".current").innerHTML = current;
  };

  this.set_pager = function () {
    var total = this.totalPageNum;
    this.target.querySelector(".total").innerHTML = total;
    this.update_pager();
  };

  this.handle_buttons = function (e) {
    var _this = this;

    var action = e.target.getAttribute("data-button");

    if (action === "prev") {
      if (_this.currentPageNum === 1) {
        return;
      }

      _this.currentPageNum--;

      _this.pdfDoc.getPage(_this.currentPageNum).then(function (page) {
        _this.handlePages(page);
      });

      _this.update_pager();
    }

    if (action === "next") {
      if (_this.currentPageNum === _this.totalPageNum) {
        return;
      }

      _this.currentPageNum++;

      _this.pdfDoc.getPage(_this.currentPageNum).then(function (page) {
        _this.handlePages(page);
      });

      _this.update_pager();
    }

    if (action === "download") {
      var link = document.createElement("a");
      link.href = _this.url;
      link.download = _this.url;
      link.click();
    }

    if (action === "external") {
      var external = window.open(_this.url);
    }

    if (action === "print") {
      var print_window = window.open(_this.url);
      print_window.print();
    }

    if (action === "zoom_in") {
      if (_this.scale >= 2) {
        return;
      }

      _this.zoom_in_scale += 0.25;

      _this.resize_render(_this.zoom_in_scale);
    }

    if (action === "zoom_out") {
      if (_this.scale < 1.2) {
        return;
      }

      _this.zoom_in_scale -= 0.25;

      _this.resize_render(_this.zoom_in_scale);
    }

    if (action === "zoom_reset") {
      _this.zoom_in_scale = 0;

      _this.resize_render(_this.zoom_in_scale);
    }
  };

  this.buttons_actions = this.handle_buttons.bind(this);

  this.viewer_buttons = function () {
    var _this = this;

    var buttons = _this.target.querySelector(".uxis-pdf-buttons");

    buttons.addEventListener("click", _this.buttons_actions);
  };

  this.renderPage = function (scale) {
    var _this = this;

    var scale = scale;

    _this.pdfDoc.getPage(1).then(function (page, scale) {
      _this.handlePages(page, scale);
    });
  };

  this.resize_handler = function () {
    var _this = this;

    window.addEventListener("resize", debounce(function () {
      _this.resize_render();
    }, 150));
  };

  this.resize_render = function (scale) {
    var _this = this; //기존 캔버스 삭제


    var all_canvas = _this.target.querySelectorAll(".pdf-canvas");

    all_canvas.forEach(function (item) {
      item.remove();
    });

    if (this.mode === "one") {
      //원페이지일경우 리랜더링 과정
      _this.pdfDoc.getPage(_this.currentPageNum).then(function (page) {
        _this.handlePages(page, scale);
      });
    } else {
      //풀페이지일경우 리랜더링 과정
      _this.pdfDoc.getPage(1).then(function (page) {
        _this.currentPageNum = 1;

        _this.handlePages(page, scale);
      });
    }
  };

  this.initUxisViewer = function () {
    var _this = this; // 프레임 그리기


    _this.createFrame(); // pdf정보 가져오기


    _this.PDFJS.getDocument(this.url).then(function (pdf) {
      _this.pdfDoc = pdf;
      _this.totalPageNum = pdf.numPages; //원페이지 모드때 페이저 정보 입력

      _this.mode === "one" && _this.set_pager(); //뷰어 기능 활성화 시작

      _this.viewer_buttons(); //페이지 랜더링 시작


      _this.renderPage();
    });
  };

  this.handlePages = function (page, scale) {
    //메소드 내부안에서 this의 바인딩을 위해
    var _this = this;

    var canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.classList.add("pdf-canvas"); //첫번째 페이지 렌더링시 스크롤이 없을때라서 좀더 크게 나옴 -> 수정함

    if (_this.scroll_browser_check) {
      _this.scale = (_this.target.querySelector(".uxis-pdf-view .canvas-container").offsetWidth - 16) / page.getViewport(1).width;
    } else {
      _this.scale = _this.target.querySelector(".uxis-pdf-view .canvas-container").offsetWidth / page.getViewport(1).width;
    }

    if (scale) {
      _this.scale += scale;
    }

    _this.viewport = page.getViewport(_this.scale);
    var context = canvas.getContext("2d");
    canvas.height = _this.viewport.height;
    canvas.width = _this.viewport.width;
    page.render({
      canvasContext: context,
      viewport: _this.viewport
    });

    if (_this.mode === "one") {
      //이전 페이지 삭제
      var prev_canvas = _this.target.querySelector(".pdf-canvas");

      prev_canvas && prev_canvas.remove();

      _this.target.querySelector(".canvas-container").appendChild(canvas);

      if (_this.pageNumPending !== null) {
        _this.handlePages(_this.pageNumPending);

        _this.pageNumPending = null;
      }
    } else {
      _this.target.querySelector(".canvas-container").appendChild(canvas);

      _this.currentPageNum++;

      if (_this.pdfDoc !== null && _this.currentPageNum <= _this.totalPageNum) {
        _this.pdfDoc.getPage(_this.currentPageNum).then(function (page) {
          _this.handlePages(page, scale);
        });
      }
    }
  };

  this.init = function () {
    this.initUxisViewer();
    this.resize_handler();
  };

  return this.init();
};

UxisViewer.prototype.createButton = function (info) {
  var uxisPdfButtons = document.createElement("div");
  uxisPdfButtons.classList.add("uxis-pdf-buttons");
  var button_length = info.length;

  for (var i = 0; i < button_length; i++) {
    var action = info[i].action;
    var title = info[i].title;
    var button = document.createElement("button");
    button.classList.add("button_" + action);
    button.setAttribute("data-button", action);
    button.setAttribute("type", "button");
    button.setAttribute("title", title);
    var hidden_title = document.createElement("i");
    hidden_title.classList.add("hidden");
    hidden_title.innerHTML = title;
    button.appendChild(hidden_title);
    uxisPdfButtons.appendChild(button);
  }

  return uxisPdfButtons;
};

UxisViewer.prototype.createFrame = function () {
  var uxisViewer = document.createElement("div");
  uxisViewer.classList.add("uxis-viewer");
  var uxisToolbar = document.createElement("div");
  uxisToolbar.classList.add("uxis-toolbar");
  uxisToolbar.style.backgroundColor = this.toolBarColor;
  var menuObject = null;

  if (this.mode === "one") {
    var count = document.createElement("div");
    count.classList.add("count");
    count.innerHTML = "<span class='current'></span> / <span class='total'></span>";
    uxisToolbar.appendChild(count);
    menuObject = [{
      action: "prev",
      title: "이전페이지"
    }, {
      action: "next",
      title: "다음페이지"
    }, {
      action: "download",
      title: "다운로드"
    }, {
      action: "external",
      title: "새창에서 보기"
    }, {
      action: "print",
      title: "프린트"
    }, {
      action: "zoom_in",
      title: "확대보기"
    }, {
      action: "zoom_out",
      title: "축소하기"
    }, {
      action: "zoom_reset",
      title: "RESET"
    }];
  } else {
    menuObject = [{
      action: "download",
      title: "다운로드"
    }, {
      action: "external",
      title: "새창에서 보기"
    }, {
      action: "print",
      title: "프린트"
    }, {
      action: "zoom_in",
      title: "확대보기"
    }, {
      action: "zoom_out",
      title: "축소하기"
    }, {
      action: "zoom_reset",
      title: "RESET"
    }];
  }

  var buttons = this.createButton(menuObject);
  var pdfContainer = document.createElement("div");
  pdfContainer.classList.add("uxis-pdf-container");
  pdfContainer.innerHTML = '<div class="uxis-pdf-view"><div style="width:100%" class="canvas-container"></div></div>';
  uxisToolbar.appendChild(buttons);
  uxisViewer.appendChild(uxisToolbar);
  uxisViewer.appendChild(pdfContainer);
  this.target.appendChild(uxisViewer);
};
/**
 * @class	Modal
 * @param	{String}	TemplateName	Name of template file without extension
 * @param	{String}	Options			Settings differing from defaultOptions object
 * @param	{String}	Parent			Parent modal
 * @author	Joseph Dalrymple <me@swivel.in>
 * @description	PureModals is a robust and featureful class for displaying a modal or dialog using pure JavaScript
 */
var Modal = (function(){
	/**
	 * @constructor
	 * @param	{String}	TemplateName	Name of template file without extension
	 * @param	{String}	Options			Settings differing from defaultOptions object
	 * @param	{String}	Parent			Parent modal
	 */
	var Constructor = function(TemplateName, Data, Options, Parent) {
		this.__originalArguments = Array.prototype.slice.call(arguments,0);

		// Carry Data
		this.data = Data;

		// TemplateName is required
		if (!TemplateName || typeof TemplateName != "string") {
			if (!this.modalName || typeof this.modalName != "string") {
				throw new TypeError("First parameter must be string if extended class has not specified a template");
			}
		} else {
			this.modalName = TemplateName;
		}

		// Property Definitions
		this.options = Extend.mergeObjects({},
			Options || {},
			this.defaultOptions
		);

		this.userOptions = Options || {};

		this.displayed = false;
		this.overlay = null;

		// Generate unique ID
		this.guid = this.__generateId();

		// Event listener stacks
		this.events = {};
		this.closeEvents = {
			'back': [],
			'button': [],
			'method': [],
			'all': []
		};

		// Set initial content (from options objects)
		this.__initContent.apply(this,arguments);

		// Check for parent
		if (Parent) {
			// Use parent's flow
			this.flow(Parent.flow())
			this.flow().push(this);

			this.parent = Parent;
		}

		// If displayOnInstantiation is on, go ahead and display modal
		if (this.getSetting('displayOnInstantiation')) {
			this.Display();
		}
	};


	// Methods and Properties
	Constructor.prototype = {
	/**
	 * Instance Properties
	 */
		data: null,
		content: null,
		options: null,
		modalName: null,
		displayed: false,
		overlay: null,
		guid: false,
		events: null,
		closeEvents: null,
		target: null,
		parent: null,


	/**
	 * Selector Processes
	 */
		contentExclude: [
			{ "method": 'querySelector', "args": ['[data-role="breadcrumbs"]'] },
			{ "method": 'querySelectorAll', "args": ['*'] }
		],
		contentInclude: [
			{ "method": 'querySelectorAll', "args": ['[data-content],data[value]'] }
		],
		breadcrumbsInclude: [
			{ "method": 'querySelectorAll', "args": ['[data-crumb]'] }
		],


	/**
	 * Global Properties
	 */
		pureModal: true,
		openModals: {},
		defaultOptions: {
			async: true,
			classes: [],
			css: {},
			position: {
				"center": true, // true/false
				"anchor": [null, ""], // [DomElem, Position]
				"container": null, // DomElem
				"viewport": true // true/false
			},
			posPriority: [
				"center",
				"anchor",
				"container",
				"viewport"
			],
			posBuffer: {
				"anchor": 5,
				"container": -20,
				"viewport": 10,
				"override": null
			},
			scrollTo: false,
			tplDir: "",
			tplExt: ".html",
			tplParams: null,
			tplUrlOverride: "",
			useCache: true,
			overlay: true,
			overlayClose: "self", // all, self, flow
			copyContent: true,
			useContentSetters: true,
			replaceContentSetters: true,
			hideParent: true,
			stackOverlay: false,
			modalIsScrollable: false,
			initializers: {
				"breadcrumbs": true,
				"openers": true,
				"closers": true,
				"roles": true
			},
			zIndex: null,
			displayOnInstantiation: true,
			manuallyDisplayAfterInit: false
		},
		zIndexes: {
			start: 30000,
			interval: 1000,
			next: 0
		},
		global: {
			cache: {},
			topModal: null,
			overlayModal: null
		},


	/**
	 * Properties for Getters/Setters
	 */
		_dom: null,
		_tpl: null,
		_zIndex: null,
		_flow: null,


	/**
	 * Setters/Getters
	 */
		dom: function(val) {
			if (arguments.length<1) {
				// If dom is not set, clone template
				if (!this._dom) {
					this._dom = this.tpl().clone(true);
				}
				return this._dom;
			}

			return this._dom = val;
		},

		tpl: function(val) {
			if (arguments.length<1) {
				return this._tpl;
			}
			return this._tpl = val;
		},

		zIndex: function(val) {
			if (arguments.length===1) {
				return this.options.zIndex = val;
			}

			// Check if zIndex has been set
			if (!this.options.zIndex) {
				// Check if zIndex counter is active
				if (this.zIndexes.next <= 0) {
					// if not, start
					this.zIndexes.next = this.zIndexes.start;
				}
				// Set zIndex and increment counter
				this.options.zIndex = this.zIndexes.next;
				this.zIndexes.next += this.zIndexes.interval;
			}
			// Return current zIndex
			return this.options.zIndex;
		},

		flow: function(val) {
			if (arguments.length===1) {
				return this._flow = val;
			}

			// if flow is not set, create new one
			if (!this._flow) {
				this._flow = new ModalFlow(this);
			}
			return this._flow;
		},


	/**
	 * DOM Methods
	 */
		/**
		 * @function
		 * @name	Display
		 * @returns	{Modal}	this
		 */
		Display: function() {
			// If modal has been displayed before
			if (
				this.displayed===true &&
				this.modal &&
				this.modal.parentNode
			) {
				// Show if it is hidden
				if (this.isHidden()) {
					this.show();
				}
			} else {
				this.displayed = false;

				// Initialize template
				this.__initTpl();
			}

			// Return self
			return this;
		},


		/**
		 * @function
		 * @name			initView
		 * @description		To be overwritten by extended classes
		 */
		initView: function() {
			return true;
		},


		/**
		 * @function
		 * @name			initOverlay
		 * @description		Create overlay element
		 * @returns			DOM Node
		 */
		initOverlay: function() {
			// Create element
			var overlay = document.createElement('div');
			this.addClass(overlay,"pure-modal-overlay");
			return overlay;
		},


		/**
		 * @function
		 * @private
		 * @name	__initContent
		 * @description	Initialize options objects
		 */
		__initContent: function() {
			var content;

			// Check to see if option exists
			if (this.hasOwnProperty('content')) {
				content = this.content;
			} else if (this.options.hasOwnProperty('content')) {
				content = this.options.content;
			} else {
				// Get from defaultOptions object
				content = this.defaultOptions.content;
			}

			// Is content a function?
			if (typeof content === "function") {
				// If so, execute to get content object
				this.content = content.apply(this,arguments) || {};
			} else {
				if (this.getSetting('copyContent') && content && content.constructor === Object) {
					this.content = {};
					for (var x in content) {
						this.content[x] = content[x];
					}
				} else {
					// Otherwise, set to content (or empty object)
					this.content = content || {};
				}
			}

			// Delete from options object
			delete this.options.content;
		},


		/**
		 * @function
		 * @private
		 * @name	__initModalDom
		 * @description	Initializes modal DOM after template is retrieved
		 */
		__initModalDom: function() {
			this._initializing = true;

			// Get dom and create modal container
			var dom = this.dom(),
				modal = this.modal = document.createElement('div');

			// Append modal DOM to container
			this.dom().appendTo(modal);

			// Create className attribute string
			modal.className = [
				"pure-modal"
			].concat(
				this.getSetting('classes')
			).join(" ");

			// Set modal attributes
			modal.setAttribute('data-modal-name', this.modalName);
			modal.setAttribute('data-modal-guid', this.guid);

			var css = this.getSetting('css');
			if (css) {
				for (var prop in css) {
					var val = css[prop];
					modal.style[prop] = val;
				}
			}

			// Cancel display if beforeDisplay returns false
			if(this.trigger('beforeDisplay', true)===false) return;

			// Initialize view and display
			var ret = this.initView();
			if(!this.getSetting('manuallyDisplayAfterInit') && ret!==false) {
				this.__displayDom();
			}
		},

		__createScrollableContainer: function(){
			var table = document.createElement('div');
			this.addClass(table, "pure-modal-scrollable");

			var cell = document.createElement('div');
			this.addClass(cell, "pure-modal-scrollable-cell");
			table.appendChild(cell);

			var scrollable = document.createElement('div');
			this.addClass(scrollable, "pure-modal-scrollable-container");
			cell.appendChild(scrollable);

			return [table,scrollable];
		},

		__disableBodyScrolling: function(){
			var body = document.body,
				scrollTop = this.__getScrollTop(),
				ext = scrollTop.toString().indexOf("px") ? "px" : "",
				htmlElem = document.documentElement,
				docHeight = this.__getDocumentHeight();

			body.scrollTop = 0;
			body.setAttribute('oldHeight',body.style.height);
			body.style.height = docHeight+"px";

			this.addClass(htmlElem, "pm-no-scroll-main");

			body.style.top = "-" + scrollTop + ext;

			return this;
		},

		__restoreScrollAndBodyElement: function(){
			var body = document.body,
				scrollTop = body.style.top.toString().substr(1).replace(/px/i,''),
				htmlElem = document.documentElement;

			this.removeClass(htmlElem, "pm-no-scroll-main");

			body.style.top = "auto";
			body.style.height = body.getAttribute('oldHeight');
			body.scrollTop = scrollTop;

			return this;
		},

		__getDocumentHeight: function(){
			var docElem = document.documentElement, bodElem = document.body;
			return Math.max(
				bodElem.scrollHeight, docElem.scrollHeight,
				bodElem.offsetHeight, docElem.offsetHeight,
				bodElem.clientHeight, docElem.clientHeight
			);
		},


		/**
		 * @function
		 * @name	__displayDom
		 * @description	Display the modal
		 * @returns	{Modal} this
		 */
		__displayDom: function() {
			// Initialize components
			this.__initComponents();

			var modal = this.modal,
				scollable = this.getSetting('modalIsScrollable');

			if(scollable) {
				var resp = this.__createScrollableContainer(),
					dom = resp[0],
					container = resp[1];

				this.overlay = dom;

				document.body.appendChild(dom);
				container.appendChild(modal);

				dom.style.zIndex = this.zIndex();

				modal.style.position = "relative";
				modal.style.display = "inline-block";

				this.__disableBodyScrolling();
				this.closeEvents.all.push(this.__restoreScrollAndBodyElement);
			} else {
				// Append modal to the body
				document.body.appendChild(modal);

				// Set position and style
				var css = this.getSetting('css');
				if (!css || !css.position) {
					modal.style.position = "absolute";
				}

				modal.style.zIndex = this.zIndex();

				this.RefreshPosition(true);
			}

			var Parent = this.parent;
			if (Parent) {
				// Hide parent and attach show event
				if (this.getSetting('hideParent')) {
					Parent.hide();
				}

				this.closeEvents.all.push(function(){
					Parent.show();
				});
			}

			// Toggle "pure-is-open" class on body tag when modal is open
			document.body.classList.add('pure-is-open');
			this.closeEvents.all.push(function(){
				var open = false;

				for(var x in Modal.openModals) {
					if(!Modal.openModals.hasOwnProperty(x)) continue;

					open = true;
					break;
				}

				if(!open) {
					document.body.classList.remove('pure-is-open');
				}
			})

			// Display overlay
			this.__initOverlay();

			// Set flags
			this.displayed = true;
			this._initializing = false;

			this.openModals[this.guid] = this;

			if(!scollable) {
				// Set resize event
				var that = this;
				window.addEventListener("resize",function(){
					that.RefreshPosition();
				});
			}

			// Trigger callbacks
			this.trigger('display visible');

			return this;
		},


		/**
		 * @funcion
		 * @private
		 * @name	__initOverlay
		 * @description	Get, style, and attache events to overlay DOM, then display it
		 */
		__initOverlay: function() {
			// Is overlay enabled?
			var overlay = this.overlay || this.getSetting('overlay'),
				thisModal = this;

			// if overlay is not enabled or does not exist, cancel
			if (!overlay) return;

			// Check to see if overlay has DOM
			if(!this.__isDOM(overlay)) {
				// If not, generate DOM
				overlay = this.initOverlay();

				// Determine zIndex of overlay
				if (!overlay.style.zIndex) {
					overlay.style.zIndex = this.zIndex() - Math.ceil(this.zIndexes.interval / 10);
				}
			}

			// Close overlay on click setting
			if (this.getSetting('overlayClose')) {
				// Attach event listener
				overlay.addEventListener('click',function(e){
					var targetElem = e.target || e.srcElement;
					if(targetElem!=this && thisModal.isChildOfModal(targetElem)) return;

					e.stopPropagation();

					// Get close action
					var closeAction = thisModal.getSetting('overlayClose');

					// If empty or set to none, cancel
					if (!closeAction || closeAction=="none") return;

					// Get modal's flow and open modals
					var thisFlow = thisModal.flow(),
						allModals = thisModal.openModals;

					// Trigger close on current modal
					thisModal.triggerClose('overlay');

					switch (closeAction) {
						case "self":
							// Executed above
							break;
						case "all":
							// Close all modals
							for (var guid in allModals) {
								if (!allModals.hasOwnProperty(guid)) return;

								allModals[guid].triggerClose('parent overlay');
							}
							break;
						case "flow":
						case true:
						default:
							// Close all modals displayed in current flow
							for (var i=(thisFlow.length-1);i>-1;i++) {
								thisFlow[i].triggerClose('parent overlay');
							}
							break;
					}
				});
			}

			// Store overlay
			this.overlay = overlay;

			// Retrieve current overlayed modal
			var curModal = this.global.overlayModal

			// Check to see if same as this, doesn't exist, or is hidden
			if (this.getSetting('stackOverlay') || curModal === this || !curModal || curModal.isHidden()) {
				// Set overlayed modal to this and append it to body
				this.global.overlayModal = this;
				document.body.appendChild(overlay);

				// Trigger event
				this.trigger('showOverlay');
			} else {
				// Queue show of overlay with hidding of other overlay
				curModal.on('hideOverlay', function(){
					// Is this modal hidden?
					if (thisModal.isHidden()) return;

					// Is this modal even open anymore?
					if (!this.openModals.hasOwnProperty(thisModal.guid)) return;

					// Show overlay
					thisModal.__initOverlay();
				});
			}
		},


		/**
		 * @function
		 * @private
		 * @name	__initComponents
		 * @description	Call all methods tied to "initializers" property
		 */
		__initComponents: function() {
			// initializers.setters
			this.setContentItems();

			// initializers.breadcrumbs
			this.__initBreadcrumbs();

			// initializers.roles
			this.parseContentItems(
				this.__getContentElements()
			);

			// initializers.openers
			this.initOpeners();
			// initializers.closers
			this.initClosers();
		},


		/**
		 * @function
		 * @private
		 * @name	initOpeners
		 * @description	Attach events to all modal openers in this modal's DOM
		 */
		initOpeners: function(dom) {
			// Check to see if we even want openers
			var exec = this.getSetting('initializers');
			if (!exec || !exec.openers) return;

			// Get all opener links in this modal's DOM
			var that = this,
				parentModal = (dom) ? null : this,
				modalDom = dom || this.modal,
				modalLinks = modalDom.querySelectorAll('[data-modal],[data-modal-class]');

			// Iterate over links
			for (var i=0;i<modalLinks.length;i++) {
				var link = modalLinks[i];

				// Attach open even to links
				link.addEventListener('click',function(e){
					e.preventDefault();

					var guid = this.openModal;
					// Has this link already been clicked?
					if (guid && Modal.prototype.openModals.hasOwnProperty(guid)) {
						var thisModal = Modal.prototype.openModals[guid];

						// If so, check to see if it is visible
						if (thisModal.isHidden()) {
							thisModal.show();
						}

						return;
					}

					var options = {};

					// Get name of class to utilize
					var className = this.getAttribute('data-modal-class');
					if (!className) {
						className = "Modal";
					}

					var modalClass = that.getContructorFromString(className);
						data = that.getDataFromDom(this);

					// Pass event and target element
					data.targetEvent = e;
					data.target = this;

					// Retrieve name of modal to open
					var modalTpl = this.getAttribute('data-modal');
					if (!modalTpl || modalTpl=="" || modalTpl.indexOf("%")>-1) {
						var attr = modalTpl.replace(/\%/ig,''),
							attrVal = this.getAttribute(attr);

						modalTpl = null;

						if (attrVal) {
							options.tplUrlOverride=attrVal;
						} else if (!modalClass.prototype.modalName) {
							console.error("Invalid Modal Name: "+modalTpl);
							return;
						}
					}

					// Try to open modal with specified classname
					try {
						var newModal = new modalClass(modalTpl, data, options, parentModal);
					} catch(e) {
						// Display error
						console.error("Error initializing modal: " + className);
						console.error(e.stack);
						console.log(this);
						return;
					}

					// Display was succesful; track this modal's guid.
					this.openModal = newModal.guid;
				}, true);
			}
		},


		getContructorFromString: function(className) {
			if (!className) {
				consoleError("Invalid Modal Constructor: empty");
				return void 0;
			}

			var modalConstructor = null;
			if (className.indexOf('.')>-1) {
				modalConstructor = window;

				var classParts = className.split('.');
				for (var c=0;c<classParts.length;c++) {
					var classVar = classParts[c];
					if (!classVar || !modalConstructor[classVar]) {
						modalConstructor = null;
						break;
					}

					modalConstructor = modalConstructor[classVar];
				}
			} else {
				modalConstructor = window[className];
			}

			if (!modalConstructor || modalConstructor===window) {
				consoleError("Invalid Modal Constructor Name: " + className);
				return void 0;
			}

			return modalConstructor;
		},

		getDataFromDom: function(dom) {
			var dataArr = [].filter.call(
				dom.attributes,
				function(at) {
					return /^data-/i.test(at.name);
				}
			), data = {};

			for (var d=0;d<dataArr.length;d++) {
				var attr = dataArr[d];
				if (!attr.name || attr.name=="") continue;

				var name = attr.name.replace(/^data-/i,'');
				data[name] = attr.value;
			}

			return data;
		},


		/**
		 * @function
		 * @private
		 * @name	initClosers
		 * @description
		 */
		initClosers: function() {
			var exec = this.getSetting('initializers');
			if (!exec || !exec.closers) return;

			var thisModal = this,
				modalDom = this.modal,
				closeLinks = modalDom.querySelectorAll('[data-close]');

			for (var i=0;i<closeLinks.length;i++) {
				var link = closeLinks[i];

				link.addEventListener('click', function(e){
					e.preventDefault();

					var closeType = "button",
						closeWhat = this.getAttribute('data-close');
					switch (closeWhat) {
						case "flow":
							var flow = thisModal.flow();
							flow.goTo(0,closeType).triggerClose(closeType);
							break;
						case "all":
							var allModals = thisModal.openModals;
							for (var guid in allModals) {
								if (!allModals.hasOwnProperty(guid)) return;

								allModals[guid].triggerClose(closeType);
							}
							break;
						case "this":
						default:
							thisModal.triggerClose(closeType);
					}
				});
			}
		},

		__initBreadcrumbs: function() {
			var exec = this.getSetting('initializers');
			if (!exec || !exec.breadcrumbs) return;

			var modalDom = this.modal,
				crumbyLists = modalDom.querySelectorAll('[data-role="breadcrumbs"]');

			for (var l=0;l<crumbyLists.length;l++) {
				var list = crumbyLists[l],
					liTpl = list.querySelector('[data-role="crumb"]'),
					flow = this.flow();

				list.removeChild(liTpl);

				for (var x=0;x<flow.length;x++) {
					var curModal = flow.get(x),
						li = liTpl.cloneNode(true);

					li.setAttribute('data-crumb',x);
					this.parseContentItems(li, curModal.content);
					this.__initCrumbEvent(li);

					list.appendChild(li);
				}
			}

			var crumbs = this.__getContentCrumbs();
			for (var i=0;i<crumbs.length;i++) {
				this.__initCrumbEvent(crumbs[i]);
			}
		},

		__initCrumbEvent: function(li) {
			if (!li) return;

			var thisModal = this;
			li.addEventListener('click',function(e){
				e.preventDefault();

				var dest = this.getAttribute('data-crumb');
				if (!dest) return;

				var flow = thisModal.flow();
				flow.goTo(dest);
			});
		},

		show: function() {
			if (!this.openModals.hasOwnProperty(this.guid)) return this;

			if (!this.__isDOM(this.modal) || !this.modal.parentNode) return this;

			if(this.getSetting('modalIsScrollable')) {
				this.overlay.style.display = "block";
			} else {
				this.modal.style.display = "block";

				this.__initOverlay();
			}

			this.trigger('show visible');

			return this;
		},

		hide: function() {
			if (this.isHidden()) return this;

			if(this.getSetting('modalIsScrollable')) {
				this.overlay.style.display = "none";
				this.trigger('hideOverlay');
			} else {
				this.modal.style.display = "none";

				if (this.__isDOM(this.overlay) && this.overlay.parentNode) {
					this.overlay.parentNode.removeChild(this.overlay);
					this.overlay = null;

					this.trigger('hideOverlay');
				}
			}

			this.trigger('hide');

			return this;
		},

		isHidden: function() {
			return (!this.__isDOM(this.modal) || !this.modal.parentNode || !this.__isVisible(this.modal));
		},

		/**
		 * Checks if a DOM element is visible. Takes into
		 * consideration its parents and overflow.
		 *
		 * Author: Jason Farrell
		 * Author URI: http://useallfive.com/
		 * Package URL: https://github.com/UseAllFive/ua5-js-utils
		 *
		 * @param (el)      the DOM element to check if is visible
		 *
		 * These params are optional that are sent in recursively,
		 * you typically won't use these:
		 *
		 * @param (t)       Top corner position number
		 * @param (r)       Right corner position number
		 * @param (b)       Bottom corner position number
		 * @param (l)       Left corner position number
		 * @param (w)       Element width number
		 * @param (h)       Element height number
		 */
		__isVisible: function(el, t, r, b, l, w, h) {
			var p = el.parentNode,
				VISIBLE_PADDING = 2;

			//-- Return true for document node
			if (p && 9 === p.nodeType ) {
				return true;
			}

			//-- Return false if our element is invisible
			if (
				'0' === this.__getStyle(el, 'opacity') ||
				'none' === this.__getStyle(el, 'display') ||
				'hidden' === this.__getStyle(el, 'visibility')
			) {
				return false;
			}

			if (
				'undefined' === typeof(t) ||
				'undefined' === typeof(r) ||
				'undefined' === typeof(b) ||
				'undefined' === typeof(l) ||
				'undefined' === typeof(w) ||
				'undefined' === typeof(h)
			) {
				t = el.offsetTop;
				l = el.offsetLeft;
				b = t + el.offsetHeight;
				r = l + el.offsetWidth;
				w = el.offsetWidth;
				h = el.offsetHeight;
			}

			//-- If we have a parent, let's continue:
			if ( p ) {
				//-- Check if the parent can hide its children. Also, only check offset parents.
				if ( ('hidden' === this.__getStyle(p, 'overflow') || 'scroll' === this.__getStyle(p, 'overflow')) && el.offsetParent === p ) {
					//-- Only check if the offset is different for the parent
					if (
						//-- If the target element is to the right of the parent elm
						l + VISIBLE_PADDING > p.offsetWidth + p.scrollLeft ||
						//-- If the target element is to the left of the parent elm
						l + w - VISIBLE_PADDING < p.scrollLeft ||
						//-- If the target element is under the parent elm
						t + VISIBLE_PADDING > p.offsetHeight + p.scrollTop ||
						//-- If the target element is above the parent elm
						t + h - VISIBLE_PADDING < p.scrollTop
					) {
						//-- Our target element is out of bounds:
						return false;
					}
				}

				//-- Add the offset parent's left/top coords to our element's offset:
				if ( el.offsetParent === p ) {
					l += p.offsetLeft;
					t += p.offsetTop;
				}

				//-- Let's recursively check upwards:
				return this.__isVisible(p, t, r, b, l, w, h);
			}

			return true;
		},

		/**
		 * Author: Jason Farrell
		 * Author URI: http://useallfive.com/
		 * Package URL: https://github.com/UseAllFive/ua5-js-utils
		 */
		__getStyle: function(el, property) {
			if ( window.getComputedStyle ) {
				return document.defaultView.getComputedStyle(el)[property];
			}
			if ( el.currentStyle ) {
				return el.currentStyle[property];
			}
		},

		__stringToDom: function(str) {
			var tmp = document.createElement('div');

			tmp.innerHTML = str;

			var nodeList = this.__cleanNodeList(tmp.childNodes);

			return new ExtNodeList(nodeList);
		},

		__cleanNodeList: function(nodeList) {
			if(!(nodeList instanceof NodeList)) {
				throw new TypeError("First parameter must be of type NodeList");
			}

			for(var i=0;i<nodeList.length;i++) {
				var elem = nodeList[i];
				if(elem instanceof Text) {
					var nodeVal = elem.nodeValue;
					if(nodeVal=="" || nodeVal.match(/^\s+$/i)) {
						elem.parentNode.removeChild(elem);
					}
				} else if (elem.childNodes.length > 0) {
					this.__cleanNodeList(elem.childNodes);
				}
			}

			return nodeList;
		},

		__isDOM: function(obj) {
			if(typeof obj != "object"||obj==void 0||obj==null) return false;
			return (this.__isNode(obj) || this.__isElement(obj) || obj instanceof NodeList);
		},

		/**
		 * @link http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
		 */
		__isNode: function(obj){
			if(typeof obj != "object"||obj==void 0||obj==null) return false;
			return (
				typeof Node === "object" ?
					obj instanceof Node
				:
					obj &&
					typeof obj === "object" &&
					typeof obj.nodeType === "number" &&
					typeof obj.nodeName === "string"
			);
		},

		/**
		 * @link http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
		 */
		__isElement: function(obj){
			if(typeof obj != "object"||obj==void 0||obj==null) return false;
			return (
				typeof HTMLElement === "object" ?
					obj instanceof HTMLElement
				:
					obj &&
					typeof obj === "object" &&
					obj.nodeType === 1 &&
					typeof obj.nodeName === "string"
			);
		},

		/**
		 * @link http://andylangton.co.uk/blog/development/get-viewport-size-width-and-height-javascript
		 */
		__getViewportSize: function(){
			if (typeof window.innerWidth != 'undefined') {
				return {
					width: window.innerWidth,
					height: window.innerHeight
				};
			}

			var body = document.documentElement || document.getElementsByTagName('body')[0];
			return {
				width: body.clientWidth,
				height: body.clientHeight
			};
		},

		/**
		 * @link http://www.quirksmode.org/js/findpos.html
		 */
		__getElementOffset: function(obj){
			var offset = {left:0,top:0};

			if (obj.offsetParent) {
				do {
					offset.left += obj.offsetLeft;
					offset.top += obj.offsetTop;
				} while (obj = obj.offsetParent);
			}

			return offset;
		},


	/**
	 * Destroyers
	 */
		Close: function() {
			this.triggerClose("method");
		},

		triggerClose: function(event) {
			if (!event) {
				event = "method";
			}


			if(this.__isDOM(this.modal) && this.modal.parentNode) {
				this.modal.parentNode.removeChild(this.modal);
			}


			var self = this.flow().indexOf(this);
			if (self>-1) {
				this.flow().splice(self,1);
			}

			this.flow(null);


			delete this.openModals[this.guid];
			this.displayed = false;


			var events = this.closeEvents['all'].concat(this.closeEvents[event] || []);
			if (events.length>0) {
				for (var i=0;i<events.length;i++) {
					var func = events[i],
						firstIndex = events.indexOf(func);

					// Do Not Execute More Than Once!
					//if (firstIndex!=i) continue;

					if (func instanceof Function) {
						func.apply(this);
					}
				}
			}


			if(this.__isDOM(this.overlay) && this.overlay.parentNode) {
				this.overlay.parentNode.removeChild(this.overlay);
				this.overlay = null;
			}

			if (this.global.overlayModal == this) {
				this.global.overlayModal = null;
			}
		},


	/**
	 * Events
	 */
		trigger: function(event, dieOnFalse) {
			var reg = /\s+/ig;
			if (reg.test(event)) {
				var events = event.split(reg);
				for (var i=0;i<events.length;i++) {
					var res = this.trigger(events[i]);

					if (dieOnFalse && res===false) {
						return false;
					}
				}
				return true;
			}

			var eventArr = this.events[event];
			if (eventArr && eventArr.length>0) {
				for (var i=0;i<eventArr.length;i++) {
					var func = eventArr[i],
						firstIndex = eventArr.indexOf(func);

					// Do Not Execute More Than Once!
					if (firstIndex!=i) continue;

					if (func instanceof Function) {
						var res = func.apply(this,[event]);

						if (dieOnFalse && res===false) {
							return false;
						}
					}
				}
			}

			return true;
		},

		on: function(event, func) {
			var reg = /\s+/ig;
			if (reg.test(event)) {
				var events = event.split(reg);
				for (var i=0;i<events.length;i++) {
					this.on(events[i], func);
				}
				return this;
			}

			var eventArr = this.events[event];
			if (!eventArr) {
				eventArr = this.events[event] = [];
			}

			if (eventArr.indexOf(func) < 0) {
				eventArr.push(func);
			}

			return this;
		},


	/**
	 * Position Methods
	 */
		RefreshPosition: function(force) {
			if (this.getSetting('modalIsScrollable')) return;
			if (!force && this.isHidden()) return;

			var methods = this.getSetting('posPriority');

			for (var x=0;x<methods.length;x++) {
				var m = methods[x],
					methodName = "__"+m+"Pos";

				if (this[methodName] && typeof this[methodName] === "function") {
					this[methodName].call(this);
				}
			}

			this.trigger('move');
		},

		__centerPos: function() {
			var modal = this.modal,
				width = modal.offsetWidth,
				height = modal.offsetHeight,
				v,viewport = (v=this.__getViewportSize(),v.scrollTop=window.scrollY,v),
				setting = this.getSetting('position').center;

			if (!setting) return;

			modal.style.top = ((viewport.height / 2) - (height / 2)).toString() + "px";
			modal.style.left = ((viewport.width / 2) - (width / 2)).toString() + "px";
		},

		__viewportPos: function() {
			var modal = this.modal,
				setting = this.getSetting('position').viewport;

			if (!setting) return;

			var bufferSettings = this.getSetting('posBuffer'),
				buffer = bufferSettings.override || bufferSettings.viewport || 0,
				v,viewport = (v=this.__getViewportSize(),v.scrollTop=window.scrollY,v),
				offset = this.__getElementOffset(modal),
				height = modal.offsetHeight,
				width = modal.offsetWidth,
				far = {
					left: offset.left,
					right: viewport.width - (offset.left + width),
					bottom: (viewport.scrollTop + viewport.height) - (offset.top + height),
					top: offset.top - viewport.scrollTop
				};

			if (far.left < 0) {
				modal.style.top = offset.top + "px",
				modal.style.left = buffer + "px"
			} else if (far.right < 0) {
				modal.style.top = offset.top + "px",
				modal.style.left = viewport.width - width - buffer + "px"
			}

			if (this.getSetting('scrollTo')) {
				if (far.top < 0) {
					window.scrollTo(0, Math.abs(far.top));
				} else if(far.bottom < 0) {
					window.scrollTo(0, Math.abs(far.bottom) + (viewport.scrollTop + buffer));
				}
			}

			if (viewport.scrollTop <= 0 && far.top < 0) {
				modal.style.top = buffer + "px";
			}
		},

		__containerPos: function() {
			var modal = this.modal,
				setting = this.getSetting('position').container;

			if (!setting) return;

			var bufferSettings = this.getSetting('posBuffer'),
				buffer = bufferSettings.override || bufferSettings.container || 0,

				offset = this.__getElementOffset(modal),
				height = modal.offsetHeight,
				width = modal.offsetWidth,

				container = setting,
				o,contOffset = (
					o=this.__getElementOffset(container),
					o.height=container.offsetHeight,
					o.width=container.offsetWidth,o
				),
				containment = {
					top: contOffset.top + buffer,
					left: contOffset.left + buffer,
					bottom: (contOffset.bottom || contOffset.top + contOffset.height) - buffer,
					right: (contOffset.right || contOffset.left + contOffset.width) - buffer
				},

				far = {
					top: offset.top - contOffset.top,
					left: offset.left - contOffset.left,
					right: (contOffset.left + contOffset.width) - (offset.left + width),
					bottom: (contOffset.top + contOffset.height) - (offset.top + height)
				};

			var newOffset = Extend.mergeObjects({},offset);
/*			if (!ignoreBot && far.bottom < 0) {
				modal.style.top = containment.bottom - dialogHeight;
				modal.style.bottom = 'auto';
			}*/

			if (far.top < 0) {
				modal.style.left = containment.top + "px";
				modal.style.bottom = 'auto';
			}

			if (far.left < 0) {
				modal.style.left = containment.left + "px";
				modal.style.right = 'auto';
			}

			if (far.right < 0) {
				modal.style.left = containment.right - width + "px";
				modal.style.right = 'auto';
			}
		},

		__anchorPos: function() {
			var settings = this.getSetting('position').anchor;

			if (!settings) return;

			var target = settings[0],
				anchor = settings[1];

			if (!this.__isDOM(target)) return;

			if (!anchor) {
				anchor = "top center"; // default
			} else {
				anchor = anchor.trim();
			}

			var anchorArr = anchor.split(/\s+/),
				tags = {
					vert: anchorArr[0],
					horz: anchorArr[1]
				},


			/**
			 * !!IMPORTANT!!
			 * The AnchorScope object is added to the scope chain within the delegated methods below.
			 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with}
			 **/
				Scope = {};
				Scope.modal = this.modal;
				Scope.target = target;

				Scope.bufferSettings = this.getSetting('posBuffer');
				Scope.buffer = Scope.bufferSettings.override || Scope.bufferSettings.anchor || 0;

				Scope.offset = this.__getElementOffset(this.modal);
				Scope.height = Scope.modal.offsetHeight;
				Scope.width = Scope.modal.offsetWidth;

				Scope.anchorDim = Extend.mergeObjects(
					{}, this.__getElementOffset(Scope.target), {
						width: Scope.target.offsetWidth,
						height: Scope.target.offsetHeight
					}
				);

				Scope.far = {
					top: (Scope.anchorDim.top + Scope.anchorDim.height + Scope.buffer) - Scope.offset.top,
					bottom: Scope.anchorDim.top - (Scope.offset.top + Scope.height + Scope.buffer),
					left: Scope.anchorDim.left + Scope.anchorDim.width - Scope.offset.left + Scope.buffer,
					right: Scope.anchorDim.left - (Scope.offset.left + Scope.width + Scope.buffer),
					vertCenter: (Scope.anchorDim.top + (Scope.anchorDim.height/2)) - (Scope.offset.top + (Scope.height/2)),
					horzCenter: (Scope.anchorDim.left + (Scope.anchorDim.width/2)) - (Scope.offset.left + (Scope.width/2))
				};
			/** END Scope Chain Declaration **/


			if (!!~tags.vert.indexOf('bot')) {
				this.__anchorBottom(Scope);
			} else if (!!~tags.vert.indexOf('cen')) {
				this.__anchorVerticleCenter(Scope);
			} else/* if (!!~tags.vert.indexOf('top')) */{ //default
				this.__anchorTop(Scope);
			}

			Scope.offset = this.__getElementOffset(this.modal);
			if (!!~tags.horz.indexOf('left')) {
				this.__anchorLeft(Scope);
			} else if (!!~tags.horz.indexOf('right')) {
				this.__anchorRight(Scope);
			} else/* if (!!~tags.horz.indexOf('cen')) */{ //default
				this.__anchorHorizontalCenter(Scope);
			}
		},

		__anchorTop: function(Scope) { with(Scope) {
			modal.style.top = offset.top + far.top + "px";
			modal.style.left = offset.left + "px";
		}},
		__anchorBottom: function(Scope) { with(Scope) {
			modal.style.top = offset.top + far.bottom + "px";
			modal.style.left = offset.left + "px";
		}},
		__anchorVerticleCenter: function(Scope) { with(Scope) {
			modal.style.top = offset.top + far.vertCenter + "px";
			modal.style.left = offset.left + "px";
		}},

		__anchorHorizontalCenter: function(Scope) { with(Scope) {
			modal.style.top = offset.top + "px";
			modal.style.left = offset.left + far.horzCenter + "px";
		}},
		__anchorLeft: function(Scope) { with(Scope) {
			modal.style.top = offset.top + "px";
			modal.style.left = offset.left + far.left + "px";
		}},
		__anchorRight: function(Scope) { with(Scope) {
			modal.style.top = offset.top + "px";
			modal.style.left = offset.left + far.right + "px";
		}},





	/**
	 * Utility Methods
	 */
		getModalsBySelector: function(sel) {
			var ret=[],flow=this.flow();
			switch (sel) {
				case "flow":
					for (var x=0;x<flow.length;x++) {
						ret.push(flow[x]);
					}
					break;
				case "all":
					var allModals = this.openModals;
					for (var guid in allModals) {
						if (!allModals.hasOwnProperty(guid)) continue;
						if (!allModals[guid]) continue;

						ret.push(allModals[guid]);
					}
					break;
				case "this":
				default:
					var fromFlow = flow.get(sel);
					if (!fromFlow) ret.push(this);
			}

			return ret;
		},

		getSetting: function(setting) {
			if (this.options && this.options.hasOwnProperty(setting)) {
				return this.options[setting];
			}
			return this.defaultOptions[setting];
		},

		newXmlHttpRequest: function() {
			try {
				return new XMLHttpRequest();
			} catch (e) {
				try {
					return new ActiveXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try {
						return new ActiveXObject("Microsoft.XMLHTTP");
					} catch (failed) {
						return false;
					}
				}
			}
		},

		__trimString: function(str) {
			if(String.prototype.trim) {
				return str.trim();
			} else {
				return str.replace(/^\s+/,'').replace(/\s+$/,'');
			}
		},

		__generateId: function() {
			return (
				this.__generateRandomString() +
				this.__generateRandomString() + '-' +
				this.__generateRandomString() + '-' +
				this.__generateRandomString() + '-' +
				this.__generateRandomString() + '-' +
				this.__generateRandomString() +
				this.__generateRandomString() +
				this.__generateRandomString()
			);
		},

		__generateRandomString: function() {
			return Math.floor(
				(1 + Math.random()) * 0x10000
			).toString(16).substring(1);
		},

		__appendParameterToUrl: function(url, param, value) {
			var qPos = url.indexOf('?'),
				lChar = url.substr(-1,1),
				delim = "";

			if(qPos>-1 && lChar!="&" && lChar!="?") {
				delim = "&";
			} else {
				delim = "?";
			}

			url += delim+param+"="+value;

			return url;
		},



	/**
	 * Template Retrieval Methods
	 */
		__initTpl: function(callback) {
			if (this.tpl()) {
				this.__initModalDom();
				return true;
			}

			if (this.getSetting('useCache') && this.global.cache[this.modalName]) {
				this._tpl = this.__stringToDom(this.global.cache[this.modalName]);
				this.__initModalDom();
				return true;
			}

			return this.__getTpl();
		},

		__getTpl: function() {
			var ajax = this.newXmlHttpRequest();
			if (!ajax) return false;

			var async = this.getSetting('async'),
				params = this.getSetting('tplParams'),
				url = this.__getTplUri();

			if(params && typeof params == "object") {
				for(var x in params) {
					if(!params.hasOwnProperty(x)) continue;

					url = this.__appendParameterToUrl(url,x,params[x]);
				}
			}

			url = this.__appendParameterToUrl(url,"_",Math.random());

			if (async) {
				var thisModal = this;
				ajax.onreadystatechange = function() {
					thisModal.__tplResponseCallback.call(thisModal,ajax);
				};
			}

			ajax.open("GET", url, async);
			ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			ajax.send();

			if (!async) {
				return this.__tplResponseCallback(ajax);
			}

			return false;
		},

		__tplResponseCallback: function(ajax) {
			if (this.displayed || this._initializing) return;

			if (ajax.readyState == 4) {
				if(ajax.status == 200) {
					this.global.cache[this.modalName] = ajax.responseText;
					this._tpl = this.__stringToDom(ajax.responseText);
					this.__initModalDom();
				} else {
					throw new Error("Error retrieving modal template. Response: "+ajax.status);

				}
			}
		},

		__getTplUri: function() {
			return this.getSetting('tplUrlOverride') || (
				this.getSetting('tplDir') +
				this.modalName +
				this.getSetting('tplExt')
			);
		},


	/**
	 * Content Methods
	 */
		__getContentElements: function() {
			var excl = this.__getUsingProcess(
				this.modal,
				this.contentExclude
			),
			incl = this.__getUsingProcess(
				this.modal,
				this.contentInclude
			);

			for (var x=0;x<excl.length;x++) {
				var elem = excl[x],
					xIndex = incl.indexOf(elem);

				if (xIndex>-1) {
					incl.splice(xIndex,1);
				}
			}

			return incl;
		},

		__getContentCrumbs: function() {
			var excl = this.__getUsingProcess(
				this.modal,
				this.contentExclude
			),
			incl = this.__getUsingProcess(
				this.modal,
				this.breadcrumbsInclude
			);

			for (var x=0;x<incl.length;x++) {
				var elem = incl[x];

				if (excl.indexOf(elem)>-1) {
					incl.splice(x,1);
				}
			}

			return incl;
		},

		__getUsingProcess: function(elem, process) {
			for (var x=0;x<process.length;x++) {
				if (!process[x]) continue;
				var proc = process[x];
				if (elem[proc.method]) {
					elem = elem[proc.method].apply(
						elem,
						proc.args
					);
				}
				if (!elem||elem.length<1) {
					return new ExtNodeList();
				}
			}

			return new ExtNodeList(elem);
		},

		setContentItems: function(dom, content) {
			if (!dom) {
				dom = this.modal;
			}

			if (!content) {
				content = this.content;
			}

			var overwrite = this.getSetting('useContentSetters'),
				replace = this.getSetting('replaceContentSetters'),
				setters = dom.querySelectorAll('[data-set]');

			for (var s=0;s<setters.length;s++) {
				var elem = setters[s],
					attrName = this.__determineValueAttr(elem),
					prop = elem.getAttribute('data-set'),
					val = elem.getAttribute('data-value') || elem[attrName],
					crnt = content[prop];

				if (overwrite && crnt!==void 0) {
					if (replace) {
						elem[attrName] = crnt;
					}
					continue;
				}

				content[prop] = val;
			}

			return true;
		},

		getContent: function(prop) {
			var self = this.content;
			if (self.hasOwnProperty(prop)) {
				return self[prop];
			}
			var dflt = this.defaultOptions.content;
			if (dflt.hasOwnProperty(prop)) {
				return dflt[prop];
			}
			return void 0;
		},

		parseContentItems: function(dom, content, exclude, removeAttr) {
			if (!content || typeof content != "object") content = this.content;
			if (!exclude) exclude = [];

			if (!content || typeof content != "object") return false;

			for (var c in content) {
				if (!content.hasOwnProperty(c)) continue;
				if (exclude.indexOf(c) > -1) continue;

				var elems = dom.querySelectorAll('[data-content="'+c+'"],data[value="'+c+'"]');
				if (!elems || elems.length < 1) continue;

				for (var ei=0;ei<elems.length;ei++) {
					var elem = elems[ei],
						valProp = this.__determineValueAttr(elem),
						retain = elem.getAttribute('data-retain');

					if (!valProp) continue;

					if (elem.tagName=="DATA") {
						if (!retain || retain!="true") {
							elem.parentNode.replaceChild(
								document.createTextNode(content[c]),
								elem
							);
						} else {
							elem[valProp] = content[c];
						}
					} else {
						elem[valProp] = content[c];

						if (retain!="true" || !!removeAttr) {
							elem.removeAttribute('data-content');
						}
					}
				}
			}

			return dom;
		},

		__determineValueAttr: function(elem) {
			// @todo EXPAND COMPATIBLE ELEMENTS/NODES
			if (!elem) return null;

			switch (elem.nodeName) {
				case "INPUT":
					return "value";
					break;
				case "IMG":
				case "SCRIPT":
					return "src";
					break;
				case "DATA":
				default:
					return "innerHTML";
			}
		},

		__getDOMParents: function(elem) {
			var arr = [];
			while (elem) {
			    arr.unshift(elem);
			    elem = elem.parentNode;
			}
			return new ExtNodeList(arr);
		},

		isChildOfModal: function(elem) {
			var ret = false;
			while (elem) {
				if(this.hasClass(elem,'pure-modal')) {
			    	ret = elem;
			    	break;
			    }
			    elem = elem.parentNode;
			}
			return ret;
		},

		__getScrollableElement: function(){
			return doc = document.documentElement, (doc.clientHeight ? doc : document.body);
		},

		__getScrollTop: function(){
			return (typeof pageYOffset != 'undefined') ? pageYOffset : (this.__getScrollableElement().scrollTop);
		},

		__cycle: function(){
			var Constructor = this.thisConstructor,
				proto = Constructor.prototype,
				args = Array.prototype.slice.call(this.__originalArguments,0),
				that = this;

			this.Close();

			for(var x in proto) {
				that[x] = proto[x];
			}

			Constructor.apply(that,args);
		},

		addClass: function(elem, className) {
			elem.className += " "+className;
			return this;
		},

		removeClass: function(elem, className) {
			if(!elem || !elem.className || !className) return false;

			var classProp = elem.className.split(/\s+/),
				pos = classProp.indexOf(className);

			if(pos>-1) {
				classProp.splice(pos,1);
			}

			elem.className = classProp.join(' ');

			return this;
		},

		hasClass: function(elem, className) {
			if(!elem || !elem.className || !className) return false;
			return (" "+elem.className.toString()+" ").indexOf(" "+className+" ")>-1;
		}
	};

	Constructor.getModalForDom = function(elem){
		var parentDom = this.isChildOfModal(elem);
		if(!parentDom) return false;

		var guid = parentDom.getAttribute('data-modal-guid');

		if(!this.openModals.hasOwnProperty(guid)) return false;

		return this.openModals[guid];
	};

	Constructor.changeDefaultSetting = function(prop, val) {
		if (typeof prop != "object") {
			this.prototype.defaultOptions[prop] = val;
		} else {
			for (var x in prop) {
				if (!prop.hasOwnProperty(x)) continue;

				this.prototype.defaultOptions[x] = prop[x];
			}
		}

		return this.prototype.defaultOptions;
	};

	Constructor.isChildOfModal = function(){ return Constructor.prototype.isChildOfModal.apply(Constructor.prototype,arguments); };
	Constructor.initOpeners = function(){ return Constructor.prototype.initOpeners.apply(Constructor.prototype,arguments); };
	Constructor.initClosers = function(){ return Constructor.prototype.initClosers.apply(Constructor.prototype,arguments); };
	Constructor.hasClass = function(){ return Constructor.prototype.hasClass.apply(Constructor.prototype,arguments); };
	Constructor.addClass = function(){ return Constructor.prototype.addClass.apply(Constructor.prototype,arguments); };
	Constructor.removeClass = function(){ return Constructor.prototype.removeClass.apply(Constructor.prototype,arguments); };
	Constructor.openModals = Constructor.prototype.openModals;

	return Constructor;
})();

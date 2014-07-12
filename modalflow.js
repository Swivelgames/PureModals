/**
 * @class	ModalFlow
 * @extends	Array.prototype
 * @param	{Modal}	modal	First modal in flow
 * @author	Joseph Dalrymple <me@swivel.in>
 * @description	Acts as a breadcrumb map, tracking the current stack of modals
 */
var ModalFlow = (function(){
	/**
	 * @constructor
	 * @description	Pushes first modal onto stack
	 */
	var Constructor = function(modal) {
		// Initialize closeEvents array
		this.closeEvents = [];
		// Push first modal onto stack
		this.push(modal);
	};


	// Methods and Properties
	Constructor.prototype = Object.create(Array.prototype, {
		/**
		 * @property {Boolean} closeOnBack If true, modal closes if "goTo" index less than 0
		 * @description The purpose of this is to close the remaining modal the
		 * user clicks back and it is the only modal in the current flow.
		 */
		closeOnBack: {
			writable: true,
			configurable: true,
			enumerable: false,
			value: true
		},


		/**
		 * @function
		 * @name goTo
		 * @description	Closes all modals in front of modal specified
		 * @param	{Mixed}	sel	Modal selector
		 * @returns	{Modal} Currently visible modal
		 */
		goTo: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function(sel, closeType) {
				// Retrieve modal using selector specified
				var i = this.getIndexBySelector(sel);

				// Set default values
				if (!closeType) closeType = "back";

				if (i<0) {
					if (!!this.closeOnBack) {
						var first = this[0];
						first.triggerClose(closeType);
						delete this[0];
						return first;
					}

					i=0;
				}

				var modal = this[i];

				// Check if modal exists
				if (i+1 < this.length) {
					// Iterate over modals in front
					for (var x=(this.length-1);i<x;x--) {
						// Close modal
						this[x].triggerClose(closeType);
						delete this[x];
					}
				}

				// Return currently visible modal
				return modal;
			}
		},


		/**
		 * @function
		 * @name	get
		 * @param	{Mixed}	sel	Selector
		 * @returns	{Modal}	Returns Modal retrieved using selector
		 */
		get: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function(sel) {
				return this[this.getIndexBySelector(sel)];
			}
		},


		/**
		 * @function
		 * @name	getIndexBySelector
		 * @param	{Mixed}	sel	Selector or Index of Modal
		 */
		getIndexBySelector: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function(sel) {
				// Default to none
				var index = -1;

				// Conditionally set index based on selector
				switch (sel) {
					// First Element Selectors
					case 0:
						index = 0;
						break;

					case "start":
					case "first":
						index = 0;
						if (this.length<2) index--;
						break;

					// Second to last element selectors
					case "prev":
					case "previous":
					case "back":
						index = this.length - 2;
						break;

					// Else...
					default:
						// Check if we're searching by name
						if (isNaN(sel)) {
							// Iterate over modals
							for (var i=0;i<this.length;i++) {
								// Return index of modal whose name matches selector
								if (this[i].tplName==sel) return i;
							}
						} else {
							// Parse Integer
							sel = parseInt(sel);
						}

						if (sel < 0) {
							// Get inverse of negative index
							index = this.length + sel;
						} else {
							// Assume selector is index
							index = sel;
						}
				}

				// Return index
				return index;
			}
		},


		/**
		 * @function
		 * @name	push
		 * @param	{Modal}	[]	Modal to push
		 */
		push: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function() {
				for (var i=0;i<arguments.length;i++) {
					// Add elements to stack
					this._addElement(this.length,arguments[i]);
				}

				// Return length
				return this.length;
			}
		},


		/**
		 * @function
		 * @name	pop
		 * @returns	{Modal} Modal removed from stack
		 */
		pop: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function() {
				// Remove last element
				return this._removeElement(this.length-1);
			}
		},


		/**
		 * @function
		 * @name	splice
		 * @param	{int}	index	Index of element on stack
		 * @param	{int}	howMany	Number of elements to delete
		 * @param	{Modal}	-		Elements to inject into stack
		 * @returns {Array} Array of elements removed from stack
		 */
		splice: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function() {
				// Get start index parameter from arguments
				var index = Array.prototype.splice.apply(arguments,[0,1])[0],
					// Get howMany parameter from arguments
					howMany = Array.prototype.splice.apply(arguments,[0,1])[0],
					// Get remaining arguments
					elements = Array.prototype.splice.apply(arguments),
					ret = [];

				// Remove items from stack
				for (var z=index;z<(index+howMany);z++) {
					// Push removed item onto return stack
					ret.push(this._removeElement(z));
				}

				// Add elements to stack
				while ((elem = elements.pop())!=undefined) {
					this._addElement(index,elem);
				}

				// Return array of removed elements
				return ret;
			}
		},


		/**
		 * @function
		 * @private
		 * @name	_addElement
		 * @param	{Integer}	i		Index at which to inject modal into
		 * @param	{Modal}		modal	Modal to add to stack
		 * @returns	{Modal}	Modal added to stack
		 */
		_addElement: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function(i,modal) {
				// Restrict stack to objects with pureModal property
				if (!modal.pureModal) {
					throw new TypeError("ModalFlow only allows pureModal objects");
				}

				// Add modal onto stack
				Array.prototype.splice.apply(this,[i,0,modal]);

				// Add callback to remove from stack when modal is closed
				var thatFlow = this;
				var func = function(){
					// Get index on ModalFlow stack
					var self = thatFlow.indexOf(this);
					if (self>-1) {
						// Remove from ModalFlow stack
						thatFlow.splice(self,1);
					}
				};

				// Attach callback to event stacks
				this.closeEvents.splice(i,0,func);
				modal.closeEvents.all.push(func);

				// Return modal added to stack
				return modal;
			}
		},


		/**
		 * @function
		 * @private
		 * @name	_removeElement
		 * @param	{Integer}	i	Index of element on stack
		 * @returns	{Modal}	Element removed from stack
		 */
		_removeElement: {
			writable: false,
			configurable: false,
			enumerable: false,
			value: function(i) {
				var x = -1;
				while((
					x = this[i].closeEvents.all.indexOf(
						this.closeEvents[i]
					)
				) > -1) {
					// Remove close callback from modal listener stack
					this[i].closeEvents.all.splice(x,1);
				};

				// Remove close callback from local listener stack
				this.closeEvents.splice(i,1);

				// Return Modal removed from stack
				return Array.prototype.splice.apply(this,[i,1])[0];
			}
		}
	});

	// Set ModalFlow to Constructor
	return Constructor;
})();

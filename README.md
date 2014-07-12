PureModals
==========
A "pure" javascript modal library for creating tooltips, interstitials, very basic and simple modals, or even complex step-based modal windows.

*NOTICE: For minified, production-ready version, checkout the `master` branch. Those looking for the non-minified, development version can simply grab the `develop` branch instead.*


Pure-Modals Quick Start Guide
====================

> Prior to diving into this "Quick Start" guide, please know that many assumptions are made as to the knowledge and familiarity with certain aspects of this library and the coding practices employed.
> 
> This is an old guide and the whole thing needs to be revamped. Honestly, there are so many different features packed into this tiny library that I really just need to map out the documentation and spend a couple weeks writing some good quality documentation for this thing. Until then, I hope this helps you get started!


For a simple "Quick Start" guide, I'll touch on a couple different things:

* Basic Definition
  * The Constructor
  * Prototype Properties
  * Prototype Methods
* Instantiation Requirements
  * Modal Options
  * Modal Template Files
  * ModalFlow
* Simple Base Modal Example
* Basic Instantiation
  * Invoke A Modal With Code
  * Invoke Via Event Listeners
* Basic Usage
  * Closing A Modal
  * Development Considerations
    * Cached DOM and Testing
    * Interacting With Surrounding Content
    * Compatibility With Various Polyfills

# Basic Definition

PureModals includes a couple utilities with it. One utility that is provided is called "Extend" which provides for the creation of prototypical objects based on the vanilla Modal library, with simple to complex deviations. A very simple modal definition will pass Extend a prototypical object containing the prototype methods and properties that to be modified, and the prototypical object that should be used as the base. Extend will combine the two prototypical objects (overwriting any overlapping properties or methods inside the second prototypical object) and provide a new prototypical object which can be used for usage.

I'll provide a simple definition, and explain the different aspects of it.

```javascript
ModalName =  
ModalName || Extend((function(){  
     var Constructor = function(TemplateName, Data, Options, Parent){  
          // ==Preparation work==
          // e.g.  
          // * Instantiation of objects for variables  
          // * Action taken on parameters provided  
          // * Initializing certain parameters  

          // Expecting: {'test':'hello world!'}  
          this.foobar = Data;  
     };  

     Constructor.prototype = {  
          // Define properties  
          modalName: "my-modal",  

          foobar: null,  

          // Define methods  
          initView: function(){  
               // Prepare the modal's contents  
               // Add event listeners onto elements inside the modal  
               // Anything else  
               var foo = this.foobar;  
               $(this.modal).find('#myElement').text(foo.test);  
          }  
     };  

     return Constructor;  
})(), Modal);  
```

In the creation of the modal, in order to save on performance we only define the modal if it hasn't already been defined. Then, we call the Extend function, and pass in our prototypical object as the first variable and the Base modal as the second parameter. If you have common methods that you would like to access across multiple modals, you can define them in a Base modal, and then provide the object as the second parameter (rather than just using the `Modal` variable and rewriting the methods). This is convenient and saves on time and execution performance.


## The Constructor

Inside our prototypical object, we have three statements. First, we define the Constructor function which will be called during instantiation. The Constructor can requires one parameter but also receives three optional parameters.

* **Data** – This will contain arbitrary data passed during the instantiation process. If initOpeners is used, all data-* attributes and their values are passed into this parameter

  Example:
```html
<a href="#" data-modal-class="MyModal" data-product-id="prod784398" data-foo="bar">Open My Modal</a>
```
```javascript
Data = { 'product-id': 'prod784398', 'foo': 'bar' };
```
* **Options** – This will override the `defaultOptions` prototype property, which will be explained in great detail later
* **Parent** – Instance of a parent modal; used in tandem with ModalFlow (explained later)

The Data attribute is automatically stored into the `data` property of the instance, and can be accessed using `this.data` inside the constructor, as well as within any of the prototype methods.


## Prototype Properties

The second thing you'll find inside the prototypical object that we're defining is the prototype object of the Constructor variable. This defines properties and methods that will be carried along with each instance of every Modal instantiated with this scheme (or a child scheme, if Extend-ed).

Some of the more key properties include the following:
* **modalName**: Unique identifier for modal. More importantly, the name of the template file, without the extension.
* **defaultOptions**: Defines the default behavior of this type of Modal

More properties can be found in the very-rough-draft version of the documentation as it sits today. These are the main properties that can be defined prior to instantiation. There are some properties, however, that are automatically populated based on how the instantiation process unfolds:
* **this.parent** – Contains the instance of the Parent modal which was used to access this modal (via link or other)
* **this.target** – Contains the HTML element or node that was the target of the event which triggered the instantiation (e.g. the anchor or button element that the user clicked on)
* **this.data** – Data argument value passed to the constructor. If `this.target` element exists, this property will contain all data-* attribute keys and values available on the target element.
* **this.modal** – An initialized version of the root DOM element of the modal retrieved; This is the element that will be attached to the body when the modal is displayed. All manipulations to this within the instance's methods will be reflected when the modal is displayed.

With the exception of the `this.modal` property, the rest of these are all available within the Constructor as well as its methods.


## Prototype Methods

The third item you'll notice is the methods. The most important method you'll ever use is the `initView` method. This is an incredibly important, yet optional, method.

The `initView` method is called prior to displaying the modal to the user. It is executed when the modal is in a ready-state, in which the architect can modify the modal's DOM using all the available assets within the PureModals library. As a best practice, this should always be defined within the prototypical object we're creating. If no modification is necessary, this method should simply `return true;`. The reason for this is to prevent any Extend-ed modal prototypes from executing their super's initView by accident.

However, there are times when this is intentional. Including when a base modal is developed, and the child prototypes simply modify properties or secondary-methods which the super utilizes. I could delve into this further, but the important thing to know is that there is a method to this madness.

There are a number of reasons to provide the `initView` method with tasks:
* The library waits on the execution of the `initView` method before showing the modal to the user, in order to make sure the modal is ready for the user.
* Event handlers that need to be attached to a modal's elements should be attached using this method.
* Data that need to be injected into the modal's DOM (changing element's values, innerHTML, etc…) should be done within this method.
* Adding/removing classes, modifying attributes, and other DOM-related tasks should be done within this method.
* And finally, this method also gives you control over whether or not to display the modal. If a condition occurs where the modal should not be displayed to the user, simply `return false;` to halt the execution of the modal and it will not be displayed to the user. UX best practices should be considered when returning a falsy value (e.g. Possibly instantiating an error modal with a message, informing the user as to why the modal is not being displayed)

These are just a few of the many uses of the `initView` method.

In order to stay within the bounds of readability and manageability for you modal, it is important to utilize different methods in order to properly organize your code. This method of modal prototype creation was built with extendability in mind to allow the developer to define whatever process necessary to achieve a stable, functional modal instance (including the user of methods, properties, and the constructor function).


And last but not least, the modal returns the Constructor to be merged with the super prototype specified.

This is a basic definition of a modal, and it can be used to create a simple or very complex modal depending on the requirements.



# Instantiation Requirements

There are a number of things to consider during the instantiation process, and some of them were briefly mentioned in the definition process. We'll expand on these now.


## Modal Options

This modal library has multiple avenues to customize the behavior of the modal instance based on your requirements. By default, the library has a list of options with pre-defined values. These defaults can be overwritten either during the definition or instantiation process of a modal's lifecycle. The best and most common method of overwriting these defaults is during the definition process.

By defining the `defaultOptions` property, we can further customize the behavior of the modal using these a large number of options. I'll list the most useful and the most commonly used options below:
* **classes** — (Array) This option should contain the CSS classes that should be added to the modal's root element when being displayed. This is useful for modifying styles using stylesheets based on the content. This property is not "smart", in that modification of it after the instantiation process will not actively modify the CSS class on the root element. This property will only be considered during the instantiation process.
* **modalIsScrollable** — (Boolean) In order to insure a clean user experience, this should always be set to true. By default, this value is false in the current version. In the unreleased version that is still being worked on, this value has been changed to true. This method affects the positioning behavior of the modal.
* **css** — (Object) While this property is somewhat common, it should be used sparingly alongside stylesheets. This property overwrites certain CSS properties on the root element to modify the visual styling of the element. This property is not "smart" (see `classes`). However, in tandem with `modalIsScrollable,` to ensure a proper user experience, this should contain the following value: {'position':'fixed'}
* **tplDir** — (String) The directory relative to the web address where the template files will reside
* **tplExt** — (String) The extension of the template filenames
* **tplParams** — (Object) A list of URL parameters to be appended to the requested URI when retrieving the template
* **overlayClose** — Defines the ModalFlow selector used when closing the modal if a user clicks on the overlay surrounding the modal (the darkened or lightened transparent area).

There are a couple of items I need to touch on prior to explaining some of the options above. The two main items are Modal Template Files and ModalFlow.


## Modal Template Files

A `Modal Template File` refers to a web resource that returns HTML code formatted for use as a modal when requested from the web server. The main thing that needs to be considered is the root element. There should only be one root element that wraps the rest of the elements. For accessibility's sake, this should be the HTML5 <dialog> tag.

**Example**:
```html
<dialog>  
    <h1>My Modal</h1>  
    <p>This is a modal</p>  
</dialog>
```

There are three main elements of a Modal Template File's resource location.

The `tplDir` option is relative to the web address of the page the user is currently on. As a best practice, the value should be relative to the base URL (i.e. the value should start with "/"). This specifies the folder that contains all the modal template files. The tplExt option is the uniform filename extension for all modal template files. By default, this is ".html". Both of the options above are concatenated to the `modalName` property to retrieve the template file.

**Example**:
```javascript
modalName: "quick-view",  
defaultOptions: {  
   tplDir: "/modals",  
   tplExt: ".jsp"  
}  
```

When the modal is called with the above configuration, a call will be made to "/modals/quick-view.jsp" to retrieve the HTML template.

Another option available for use is tplParams which is a bit more advanced and should be used sparingly. Modification of the tplParams option is only effective within the Constructor or during definition. By the time the `initView` method is called, the template has already been retrieved. tplParams is a very simple option, however. It is an object, whose keys and values represent URL parameters to be passed with the template retrieval call.

**Example**:
```javascript
this.options.tplParams = { "product-id": this.data['product-id'] };
```

This will change the previous endpoint to something that resembles the following: `/modals/quick-view.jsp?product-id=prod784398`


## ModalFlow

The last item to address is the ModalFlow concept and how it has been implemented. ModalFlow works by keeping track of the current hierarchy produced when opening modals successively. The `flow` getter method will return the current modal's flow object. This object has a number of useful methods, and Extends the Array prototype. However, it is not the purpose of this document to expand greatly on this section. Further inquiry about this subject is available by contacting the creator and maintainer of PureModals (Joseph Dalrymple).

An example of a flow is as follows:
 * User opens `LoginModal`
      * Instantiation of LoginModal occurs
      * User chooses "Create Account", which triggers opening `CreateAccountModal`
           * Instantiation of `CreateAccountModal`, `LoginModal` becomes hidden but still alive and attached to the DOM

At this point, the `CreateAccountModal` will inherit the flow object from its Parent (the `LoginModal` modal instance) and append itself.

In this example, calling the `flow()` getter method on either modal instances will return the following:

```javascript
this.flow(); // returns [ LoginModalInstance, CreateAccountModalInstance ]  
```

There are a number of ways to interact with this Array using its prototype methods. This object uses the ModalFlow Array prototype, so it comes with some extra features.

The simplest feature is the `this.flow().get( selector )` method. This method will return the modal in the current flow based on the selector provided.

A ModalFlow selector enables the developer to navigate or retrieve a modal instance based on one of the following:

* **Index in array**

  *Example*: `this.flow().get(1)` will return the second modal in the current flow
* **modalName property value**

  *Example*: `this.flow().get('login-modal')` will return the first modal whose modalName is 'login-modal'

* **Relative location** (for retrieval or navigation only; does not work with closers)

  *Possible Values are*:
    * "start" or "first", is the same as sending `this.flow().get(0)`
    * "prev", "previous", or "back" refers to the second to last element in the array (the instance right before the visible modal)

For `overlayClose`, there are four main values that are available:
* **this** — Closes only the currently visible modal (usually shows its parent modal instance if any after it closes)
* **flow** — Closes every modal within the current flow hierarchy including the visible modal
* **all** — Closes every open modal, regardless of which flow it belongs to
* **none** — Does not close any modals

These values are important to remember for use with other "Closers," which are described later on.


# Simple Base Modal Example

To conclude this section, I wanted to give a working, useable piece of code that illustrates a decent starting point (or "base") modal.

```javascript
BaseModal =  
BaseModal || Extend((function(){  
    var Constructor = function(TemplateName, Data, Options, Parent){  
        // Constructor functions  
    };  

    Constructor.prototype = {  
        // Define properties  
        defaultOptions: {  
            modalIsScrollable: true,  
            css: {  
                'position': 'fixed'  
            },  
            overlayClose: 'all'  
        },  

        // Define methods  
        initView: function(){  
            var $modal = $(this.modal);  
            // modify contents of $modal  
        }  
    };  

    return Constructor;  
})(), Modal);  
```


# Basic Instantiation

There are a couple different ways to open your modal and display it to your user. The first is by using the `new` operator, and the second is through event listeners. There are different things you need to consider for both, and I'll touch on only what is required below.


## Invoke A Modal With Code

In the definition sections of this document we went over the arguments for the Constructor method that we previously wrote. This method will be called after some basic setup work is completed by the Modal library, to prepare your Constructor function to execute in an environment conducive to manifesting a proper modal. Opening a modal with the `new` operator is very easy, and has almost already been explained in its entirety in the previous sections, so I'll briefly touch on what all is required.

```javascript
new BN.Modals.SectionName.ModalName();  
```

Let's go over a brief recap of the arguments:
* **TemplateName** - (Optional, only when `modalName` prototype property exists)
* **Data** - (Optional) Arbitrary data. Stored in `this.data` for usage throughout instance.
* **Options** (Optional) Overwrites properties inside the `defaultOptions` prototype property
* **Parent** (Optional) Instance of Modal currently visible, if directly related (for instance, if opening a "Step 2 of 3" modal, this might be "Step 1 of 3")

As you can see, all of the arguments are optional. The vast majority of the time, depending on how you structure and setup your modals, you will not be required to provide any arguments during the instantiation process.


## Invoke Via Event Listeners

The other option is to have the modal library attach itself to certain DOM elements in order to listen for Click events, and instantiate the modal accordingly.

After your DOM has been loaded and processed by the browser, you can execute the following piece of code:
```javascript
Modal.initOpeners();
```

This modal attaches itself to certain DOM elements that contain at least one of two DOM attributes, which also affect the behavior of the event handler:
* **data-modal** — This attribute should contain the value for the "TemplateName" constructor argument.
* **data-modal-class** — This attribute should specify the object that your Modal resides in. Default: "Modal"

```html
<a href="#" data-modal-class="BN.Modals.SectionName.ModalName" data-modal="my-modal" data-foo="bar"></a>  
```

The attributes are not mutually exclusive, but are only required depending on how your items are setup.

All HTML5 data-* attributes that exist on the DOM element Clicked will be passed in the Data argument. The DOM element itself will also be passed inside the Data argument, in the form of the `target` property. Additionally, the onClick event itself will be passed to the constructor via the `targetEvent` Data property  In the example above, the following would be passed as the Data argument to the Constructor:
```javascript
{  
   "modal-class": "BN.Modals.SectionName.ModalName",  
   "modal": "my-modal",  
   "foo": "bar",  
   "target": [object DOMElement],  
   "targetEvent": [object Event]  
}
```

The final item passed to the Constructor is the Parent argument. This argument is determined based on where the DOM element exists within the DOM tree. If the element clicked exists inside another modal that is currently visible to the user, the instance of the modal is passed as the Parent argument.



# Basic Usage

After instantiation, your user should be able to interact with your modal effortlessly, but there are still a couple things to consider.


## Closing A Modal

It is pretty easy to close a modal, but I'd like to go through the various options.

The first, and most common, is by adding a DOM attribute to the element within your modal's DOM tree for which you would designate your "Close Button". By adding the `data-close` attribute, you can click on the element and your modal should disappear. The possible values for `data-close` are the same as those used with the `overlayClose` option.

Which brings us to our next item: the overlay. Specifying the `overlayClose` option for your modal will allow the user to click outside of the modal to make it disappear.

For data-close and overlayClose, there are four main values that are available:
* **this** — Closes only the currently visible modal (usually shows its parent modal instance if any after it closes)
* **flow** — Closes every modal within the current flow hierarchy including the visible modal (see ModalFlow section)
* **all** — Closes every open modal, regardless of which flow it belongs to
* **none** — Does not close any modals (only valid for overlayClose)

Last, but not least, you can destroy a modal using the `Close` method on its instance. It will systematically remove itself from its associated flow, execute any Close events, and destroy its DOM.

```javascript
var myModalInstance = new MyModal();  
myModalInstance.Close();  
```


## Development Considerations

The are some things to keep in the front of your mind while developing a modal and using this library. These are specified below:


### Cached DOM and Testing

This library utilizes its own internal cache to prevent multiple requests for the same DOM for the same modal file endpoint. Because of this, developers may find themselves refreshing the entire page to test some minor DOM changes. This is not necessary. For development purposes, you can set the `useCache` option to `false` within your `defaultOptions` object. It is recommended to set this in your Base modal, that way it does not exist in any other area. It will disable the internal caching mechanism for all your modals, but you'll only need to go to one place in your code base to toggle it. Explicitly specifying the `useCache` option in every single modal will just make your code harder to maintain. The concept of Base Modals was created for a reason: to help you!

### Interacting With Surrounding Content

Remember that after your modal has been displayed to the user, it is apart of the document's DOM tree. You can access all areas on the page (input values, forms, etc...) within your modal to produce the ideal user experience. One such use case is when accessing a Parent modal's form to give specific information to the user. Remember that these modals still exist, even though they are hidden to the user. giving you full access to the modal and its DOM using either `this.parent` or your current modal's flow.

### Compatibility With Various Polyfills

Remember that with any modal library, the DOM is generated and appended to the DOM tree dynamically. Most polyfills will not take this into account, including (but certainly not limited to) selectivzr, IE9js, and others. This means that if your site heavily relies on these types of polyfills (for things like IE8 compatibility with your new and spiffy HTML5 DOM), they will need to be executed whenever any dynamic content is added to your page (not just in the instance of modals).

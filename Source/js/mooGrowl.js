/*
---
name: mooGrowl
description: a MooTools 1.4 growl style notifications, powered by CSS3 and with scale transforms
version: 1.01
authors:
  - Dimitar Christoff

 requires:

  - Core/Element.Event
  - Core/Element.Style
  - Core/Element.FX
  - Core/Element.Morph

license: MIT-style license

provides: [mooGrowl]
...
*/
(function() {

    // enable morph on CSS3 properties mootools does not support currently.
    Element.Styles.MozTransform = "rotate(@deg) scale(@)";
    Element.Styles.MsTransform = "rotate(@deg) scale(@)";
    Element.Styles.OTransform = "rotate(@deg) scale(@)";
    Element.Styles.WebkitTransform = "rotate(@deg) scale(@)";

    Object.append(Fx.CSS.Parsers, {

        TransformScale: {
            parse: function(value) {
                return ((value = value.match(/^scale\((([0-9]*\.)?[0-9]+)\)$/i))) ? parseFloat(value[1]) : false;
            },
            compute: function(from, to, delta) {
                return Fx.compute(from, to, delta);
            },
            serve: function(value) {
                return 'scale(' + value + ')';
            }
        }

    });

    var useCSS3Transforms = new Class({

        detectTransforms: function() {
            var transforms = {
                computed: ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'],
                raw: ['transform', '-webkit-transform', '-moz-transform', '-o-transform', 'msTransform']
            };

            // do some feature detection to determine what scale transform methods are available
            var testEl = new Element("div"),
                self = this;
            this.scaleTransform = transforms.computed.some(function(el, index) {
                var test = el in testEl.style;
                if (test) {
                    self.prop = transforms.raw[index];
                }

                return test;
            });

            if (!this.prop) {
                this.prop = "opacity";
            }
        }

    });


    var growl = this.mooGrowl = new Class({

        Implements: [Options,Events,useCSS3Transforms],

        options: {
            notificationDelay: 5000,
            styles: {
                right: {
                    position: "fixed",
                    top: 50,
                    right: 50,
                    width: 250,
                    background: "transparent",
                    zIndex: 10000
                },
                left: {
                    position: "fixed",
                    top: 50,
                    left: 50,
                    width: 250,
                    background: "transparent",
                    zIndex: 10000
                }
            },
            position: "right"
        },

        initialize: function(options) {
            this.setOptions(options);

            this.detectTransforms();
            this.setupContainer();
            this.messages = [];
        },

        setupContainer: function() {
            this.element = new Element("div#growlContainer", {
                 styles: this.options.styles[this.options.position] || this.options.style.right
            }).inject(document.body);

            var self = this, timer;
            this.element.addEvents({
                "mouseenter:relay(div.growlWrap)": function(e, el) {
                    clearTimeout(timer);
                    var msgObj = el.retrieve("msgObj");
                    if (!msgObj.sticky) {
                        clearTimeout(el.retrieve("timer"));
                    }
                },
                "mouseleave:relay(div.growlWrap)": function(e, el) {
                    timer = setTimeout(function() {
                        var msgObj = el.retrieve("msgObj");
                        if (!msgObj.sticky) {
                            self.setHide(el);
                        }
                    }, 500);
                }

            });
        },

        notify: function(msgObj) {
            
            msgObj.delay = msgObj.delay || 0;
            (function() {
                if (msgObj.title)
                    msgObj.title = ["<strong>", msgObj.title, "</strong>"].join("");

                var msg = new Element("div.hide.growlWrap".substitute(msgObj), {
                    html: "<div class='growlInner'><strong>{title}</strong>{text}</div>".substitute(msgObj)
                }).inject(this.element).store("msgObj", msgObj);

                if (msgObj.className) {
                    msg.addClass(msgObj.className)
                }

                this.messages.push(msgObj);
                this.show(msg, msgObj.sticky);
                if (!msgObj.sticky) {
                    this.setHide(msg);
                }
                else {
                    msg.addEvent("click", this.hide.bind(this, msg));
                }
            }).delay(msgObj.delay, this);
        },

        setHide: function(msg) {
            msg.store("timer", setTimeout(function() {
                this.hide(msg);
            }.bind(this), this.options.notificationDelay));
        },

        show: function(el, sticky) {
          var self = this,
                obj = {
                    opacity: [0, .95],
                    marginTop: [300,0]
                };

            if (this.scaleTransform) {
                obj[self.prop] = ["scale(0)", "scale(1)"];
            }

            el.set("morph", {
                onStart: function() {
                    this.element.setStyle("opacity", 0).removeClass("hide");
                },
                onComplete: function() {
                    this.removeEvents("complete");
                    this.removeEvents("start");
                    self.fireEvent("open", this.element);
                }
            }).morph(obj);

            if (sticky) {
                el.set({
                    styles: {
                        cursor: "pointer"
                    },
                    title: "click to dismiss"
                }).addClass("sticky");

            }
        },

        hide: function(el) {
            var self = this,
                obj = {
                    opacity: [.95, 0],
                    marginTop: [0, -300]
                };

            if (this.scaleTransform) {
                obj[self.prop] = ["scale(1)", "scale(0)"];
            }

            el.set("morph", {
                onStart: function() {
                    this.element.setStyle("position", "absolute");
                    // self.element.setStyle("padding-top", this.element.getSize().y).tween("padding-top", 0);

                },
                onComplete: function() {
                    this.removeEvents("complete");
                    self.fireEvent("close", this.element);
                    (function() {
                        this.element.destroy();
                    }).delay(500, this);
                }
            }).morph(obj);
        },

        toElement: function() {
            return this.element;
        }

    });


})();

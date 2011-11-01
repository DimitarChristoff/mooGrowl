/*



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

            // do some feature detection to detrmine what scale transform methods are available
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
            notificationDelay: 5000
        },

        initialize: function(options) {
            this.setOptions(options);

            this.detectTransforms();
            this.setupContainer();
            this.messages = [];
        },

        setupContainer: function() {

            this.element = new Element("div#growlContainer", {
                 styles: {
                     position: "fixed",
                     top: 50,
                     right: 50,
                     width: 250,
                     background: "transparent",
                     zIndex: 10000
                 }
            }).inject(document.body);

        },

        notify: function(title, text, type) {
            if (title.length)
                title = ["<strong>", title, "</strong>"].join("");

            var cssClass = type ? ("." + type) : '';

            var msg = new Element("div.hide.growlWrap" + cssClass, {
                html: ["<div class='growlInner'>", title, text, "</div>"].join("")
            }).inject(this.element);

            this.messages.push(msg);
            this.show(msg, !!type);
            if (!type) {
                msg.store("timer", setTimeout(function() {
                    this.hide(msg);
                }.bind(this), this.options.notificationDelay));
            }
            else {
                msg.addEvent("click", this.hide.bind(this, msg));
            }
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
                el.setStyle("cursor", "pointer").set("title", "click to dismiss");

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
                    self.messages.erase(this.element);
                }
            }).morph(obj);
        },

        toElement: function() {
            return this.element;
        }

    });


})();

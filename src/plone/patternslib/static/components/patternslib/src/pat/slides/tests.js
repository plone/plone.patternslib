define(["pat-slides"], function(pattern) {

    describe("pat-slides", function() {

        beforeEach(function() {
            $("<div/>", {id: "lab"}).appendTo(document.body);
        });

        afterEach(function() {
            $("#lab").remove();
        });

        describe("init", function() {
            it("Return result from _hook", function() {
                spyOn(pattern, "_hook").andCallFake(function() {
                    return "jq";
                });
                var elements = $();
                expect(pattern.init(elements)).toBe("jq");
                expect(pattern._hook).toHaveBeenCalledWith(elements);
            });
        });

        describe("_hook", function() {
            it("Return jQuery object", function() {
                var jq = jasmine.createSpyObj("jQuery", ["off", "on"]);
                jq.off.andReturn(jq);
                jq.on.andReturn(jq);
                expect(pattern._hook(jq)).toBe(jq);
            });
        });

        describe("_collapse_ids", function() {
            it("Single id", function() {
                expect(pattern._collapse_ids(["foo"])).toEqual(["foo"]);
            });

            it("Comma-separated list of ids", function() {
                expect(pattern._collapse_ids(["foo,bar"])).toEqual(["foo", "bar"]);
            });

            it("Skip empty ids", function() {
                expect(pattern._collapse_ids(["foo,,bar"])).toEqual(["foo", "bar"]);
            });

            it("Parameter without value", function() {
                expect(pattern._collapse_ids([null])).toEqual([]);
            });

            it("Parameter with empty value", function() {
                expect(pattern._collapse_ids([""])).toEqual([]);
            });

            it("Multiple parameters", function() {
                expect(pattern._collapse_ids(["foo", "bar"])).toEqual(["foo", "bar"]);
            });
        });

        describe("_remove_slides", function() {
            it("Remove slides from DOM", function() {
                var $show = $("<div/>", {"class": "pat-slides"});
                for (var i=1; i<=4; i++)
                    $("<div/>", {"class": "slide", id: "slide"+i}).appendTo($show);
                pattern._remove_slides($show, ["slide1", "slide3"]);
                var ids = $.makeArray($show.find(".slide").map(function(idx, el) { return el.id;}));
                expect(ids).toEqual(["slide1", "slide3"]);
            });

            xit("Trigger reset when removing slides", function() {
                var $show = $("<div/>", {"class": "pat-slides"});
                for (var i=1; i<=4; i++)
                    $("<div/>", {"class": "slide", id: "slide"+i}).appendTo($show);
                var utils = require("pat-utils");
                spyOn(utils, "debounce").andCallFake(function(func) {
                    return func;
                });
                spyOn(pattern, "_reset");
                pattern._hook($show);
                pattern._remove_slides($show, ["slide1", "slide3"]);
                expect(pattern._reset).toHaveBeenCalled();
            });

            it("Do not trigger reset when not doing anything", function() {
                var $show = $("<div/>", {"class": "pat-slides"});
                for (var i=1; i<=2; i++)
                    $("<div/>", {"class": "slide", id: "slide"+i}).appendTo($show);
                spyOn(pattern, "_reset");
                pattern._remove_slides($show, ["slide1", "slide2"]);
                expect(pattern._reset).not.toHaveBeenCalled();
            });
        });
    });
});

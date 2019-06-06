$(function () {
    var app = {

        initialize: function () {
            app.keepAwake()
            app.loadOptions();
            app.resetTimer();
            app.bindEvents()
            app.initTimer()
        },

        initTimer: function () {

            window.setInterval(function () {

                // get options values
                duration = app.getTimeOption("workout");
                sets = app.getOption("sets");
                work = app.getTimeOption("work");
                rest = app.getTimeOption("rest");
                interval = (app.is_work) ? work : rest;

                if (app.state == "starting") {
                    if (app.count == 0) {
                        app.alert("start");
                        app.lcd = "Start";
                    } else if (app.count == 1) {
                        app.alert("in");
                        app.lcd = "Start";
                    } else if (app.count == 2) {
                        app.alert("3");
                        app.lcd = app.toSS("3");
                    } else if (app.count == 3) {
                        app.alert("2");
                        app.lcd = app.toSS("2");
                    } else if (app.count == 4) {
                        app.alert("1");
                        app.lcd = app.toSS("1");
                        app.state = "started";
                    }
                    app.interval_progress = (app.count / app.startcounter) * 2; // left
                    app.count++;
                    app.HHMMSS = app.toHHMMSS(0);
                    app.drawTimer();
                } else if (app.state == "start") { // default
                    app.color = app.getColor();
                    app.lcd = "Start";
                    app.sets_left = sets;
                    app.HHMMSS = app.toHHMMSS(duration);
                    app.drawTimer();
                } else if (app.state != "finish") { // started

                    // update values
                    app.progress = (app.elapsed / duration) * 2; // workout_progression
                    app.sets_left = sets - app.set;
                    app.sets_progress = 1 - (app.set / sets); // left
                    app.interval_left = interval - app.seconds;
                    app.interval_progress = (app.seconds / interval) * 2; // left

                    // pause
                    if (app.is_paused) {
                        app.blink = !app.blink
                        app.lcd = "Pause";
                        if (app.blink) {
                            app.lcd = app.toSS(app.interval_left);
                        }
                        app.HHMMSS = app.toHHMMSS(app.elapsed);
                        app.drawTimer();
                    } else {

                        // finish
                        if (app.elapsed == duration) {
                            app.state = "finish";
                            app.lcd = "finish";
                            app.HHMMSS = app.toHHMMSS(app.elapsed);
                            app.alert("finish");
                            app.drawTimer();
                        } else if (app.seconds % interval === 0) { // switch
                            if (!app.is_work) {
                                app.state = "work"
                                app.lcd = "Work";
                                app.alert("worknow");
                            } else {
                                app.state = "rest"
                                app.lcd = "Rest";
                                app.set++;
                                app.alert("restnow");
                            }
                            app.interval_progress = 2;
                            app.is_work = !app.is_work;
                            app.seconds = 0;
                        } else {
                            app.lcd = app.toSS(app.interval_left);
                        }
                        app.HHMMSS = app.toHHMMSS(app.elapsed);
                        app.drawTimer();

                        app.elapsed++;
                        app.seconds++;
                    }
                }
            }, 1000)
        },

        drawTimer: function () {
            window.requestAnimationFrame(function () {

                // detect screen orientation

                // landscape
                var windowWidth = window.innerWidth;
                var windowHeight = window.innerHeight;
                var radius = windowHeight;
                var top = "0px";
                var font = "Ubuntu"

                // portrait
                if (windowWidth < windowHeight) {
                    radius = windowWidth;
                    top = (windowHeight - windowWidth) / 2 + "px";
                    //console.info("portrait", top);
                }

                // adjust canvas to screen
                var c = document.getElementById("timer");
                c.style.marginTop = top;
                c.width = radius;
                c.height = radius;


                // reset
                var ctx = c.getContext("2d");
                ctx.clearRect(0, 0, radius, radius);

                // 0deg   - 1.5 * Pi,
                // 90deg  - 0   * Pi, 
                // 180deg - 0.5 * Pi, 
                // 270deg - 1   * Pi
                angleStart = 1.5 * Math.PI;
                angleEnd = 0.7 * Math.PI;

                // workout progression
                var lw = radius / 30;
                var r = (radius - lw) / 2;
                var x = r + (lw / 2);
                var y = r + (lw / 2);
                //console.log(lw, r, x, y)

                ctx.beginPath(); // bg
                ctx.strokeStyle = "#26292f"; // "#211f1b"; yellow
                ctx.lineWidth = lw;
                ctx.arc(x, y, r, 0, 2 * Math.PI, false); // full
                ctx.stroke();
                ctx.closePath();
                //console.log(app.progress - .499)

                var grd = ctx.createLinearGradient(0, r * 2, 0, 0);
                grd.addColorStop(0, "#dac31c");
                grd.addColorStop(1, "#f3d920");
                angleStart = -1 * app.progress * Math.PI;
                angleEnd = Math.PI;

                ctx.beginPath(); // fg
                ctx.arc(x, y, r, 0, angleStart, angleEnd, true);
                ctx.strokeStyle = "#FFCC00"; //"#FFCC00"; yellow 
                ctx.lineWidth = lw;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.closePath();


                // #40d6a5 D64071
                // interval left progression
                var lw2 = lw * 3;
                var arcr2 = (r - lw2);
                var arcx2 = r + (lw / 2);
                var arcy2 = r + (lw / 2);

                // create gradient
                app.getColor();
                var grd = ctx.createLinearGradient(0, r * 2, 0, 0);
                grd.addColorStop(0, app.color[1]);
                grd.addColorStop(1, app.color[0]);

                ctx.beginPath(); // bg
                ctx.strokeStyle = "#15171a";
                ctx.lineWidth = lw2;
                ctx.arc(arcx2, arcy2, arcr2, 0, 2 * Math.PI, Math.PI);
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath(); // fg
                ctx.strokeStyle = grd;
                ctx.lineWidth = lw2;
                ctx.lineCap = 'round';
                ctx.arc(arcx2, arcy2, arcr2, 0, app.interval_progress * Math.PI, Math.PI);
                ctx.stroke();
                ctx.closePath();

                // repeat left progression
                var lw3 = lw / 2;
                var r3 = (radius * .15) - lw3;
                var x3 = r;
                var y3 = r / 1.4;

                ctx.beginPath(); // bg
                ctx.strokeStyle = "#333"; //red
                ctx.lineWidth = lw3;
                ctx.arc(x3, y3, r3, 0, -1 * Math.PI, Math.PI);
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath(); // fg
                ctx.strokeStyle = "#fff"; //red
                ctx.lineWidth = lw3;
                ctx.lineCap = 'round';
                ctx.arc(x3, y3, r3, 0, -1 * app.sets_progress * Math.PI, Math.PI);
                ctx.stroke();
                ctx.closePath();


                // ctx.textBaseline = "middle";
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';

                // sets
                var fs = radius * .08;
                ctx.font = fs + "px " + font;
                ctx.fillText(app.sets_left, x3, y3);

                fs = radius * .04;
                y3 += fs;
                ctx.font = fs + "px " + font;
                ctx.fillStyle = "#fff"; //red
                ctx.fillText("sets", x3, y3);

                // lcd
                fs = radius * .2;
                y3 += fs;
                // console.log(fs)
                ctx.font = fs + "px " + font;
                ctx.fillText(app.lcd, x3, y3);


                // HHMMSS
                fs = radius * .09;
                y3 += fs;
                ctx.fillStyle = "#eee";
                ctx.font = fs + "px " + font;
                ctx.fillText(app.HHMMSS, x3, y3);

                /*
                var c=document.getElementById("timer-canvas");
                var ctx=c.getContext("2d");
                var img=document.getElementById("scream");
                ctx.drawImage(img,10,10);
                */
            });
        },

        resetTimer: function () {
            var props = {
                duration: 0,
                interval: 0,
                sets: 0,
                seconds: 0,
                lcd: 0,
                interval: 0,
                interval_left: 0,
                interval_progress: 2,
                elapsed: 0,
                remainig: 0,
                progress: 0,
                set: 0,
                sets_left: 0,
                sets_progress: 1,
                count: 0,
                startcounter: 5,
                blink: 0,
                is_work: 0,
                is_paused: 0,
                color: ["#20a4f3", "#1c93da"], // blue
                state: "start"
            }
            for (var key in props) {
                app[key] = props[key];
            }
        },

        getColor: function () {
            switch (app.state) {
                case "start__": // purple
                    app.color = ["#6f20f3", "#631cda"];
                    break;
                case "finish": // yellow
                    app.color = ["#f3d920", "#dac31c"];
                    break;
                case "work": // green
                    app.color = ["#a4f320", "#93da1c"];
                    break;
                case "rest": // pink
                    app.color = ["#f320a4", "#da1c93"];
                    break;
                default: // blue
                    app.color = ["#20a4f3", "#1c93da"]
            }
        },

        bindEvents: function () {

            $(".option input, .option select").on("change", function () {
                var pattern = $(this).prop("pattern");
                if (pattern && !new RegExp(pattern).test(this.value)) {
                    this.value = this.defaultValue;
                }
                app.saveOptions();
            });

            $(".option button.plus, .option button.minus").on("mousedown", function () {
                var self = this;

                [name, action] = $(self).prop("class").split(" ");
                var f = $(self).hasClass("minus") ? -1 : 1;

                if (name != "sets") { // time
                    value = parseInt(app.getTimeOption(name)) + (f * 5);
                    if (value < 5 || value > 86399) {
                        value = 5;
                    }
                    app.setTimeOption(name, value);
                } else {
                    value = parseInt(app.getOption(name)) + (f * 1);
                    if (value < 1) {
                        value = 1;
                    }
                    app.setOption(name, value);
                }
            }).on("mouseup", function () {
                //clearInterval(app.mousedownId);
                app.saveOptions();
            });

            $("#option").on("click", function () {
                $("#options-panel").toggleClass("show");
            })

            $("#timer").on("click", function () {
                if (app.state == "finish") {
                    app.resetTimer();
                } else if (["work", "rest"].indexOf(app.state) > -1) {
                    app.is_paused = !app.is_paused;
                    if (app.is_paused) {
                        app.alert("pause");
                    } else {
                        app.alert(app.state);
                    }
                } else {
                    app.state = "starting";
                }
            })
            $("#reset").on("click", function () {
                app.resetTimer();
            })
        },

        loadOptions: function () {
            try {
                var options = localStorage.getItem("options");
                if (options) {
                    $.each(JSON.parse(options), function (i, option) {
                        if (option.type == "radio" || option.type == "checkbox") {
                            setCheckedOption(option.name, option.value);
                        } else if (option.type == "select") {
                            app.setSelectedOption(option.name, option.value);
                        } else { // text or number
                            app.setOption(option.name, option.value);
                        }
                    });
                }
            } catch (error) {
                console.error(error);
                app.resetOptions();
            }
        },

        saveOptions: function () {

            // calculate workout time
            var sets = app.getOption("sets");
            var work = app.getTimeOption("work");
            var rest = app.getTimeOption("rest");
            var limit = Math.floor(86395 / (work + rest)); // sets
            var workout = sets * (work + rest);
            if (sets > limit) {
                workout = limit * (work + rest);
                app.setOption("sets", limit);
            }
            //console.log(workout, sets, work, rest)
            app.setTimeOption("workout", workout);

            var options = [];
            $("input, option:selected").each(function () {
                options.push({
                    name: $(this).prop("name"),
                    value: $(this).prop("value"),
                    type: $(this).prop("type") || "select"
                });
            })
            localStorage.setItem("options", JSON.stringify(options));
        },

        resetOptions: function () {
            localStorage.clear();
        },

        getOption: function (name) {
            return $("input[name='" + name + "']").val();
        },

        setOption: function (name, value) {
            $("input[name='" + name + "']").val(value);
        },

        getTimeOption: function (name) {
            return app.toSeconds(app.getOption(name));
        },

        setTimeOption: function (name, value) {
            $("input[name='" + name + "']").val(app.toHHMMSS(value));
        },

        getCheckedOption: function (name) {
            return $("input[name='" + name + "']:checked").val();
        },

        setCheckedOption: function (name, value) {
            $("input[name='" + name + "']").prop("checked", true);
        },

        getSelectedOption: function (name) {
            return $("select[name='" + name + "'] option:selected").val();
        },

        setSelectedOption: function (name, value) {
            $("select option[value='" + value + "']").prop("selected", true);
        },

        toSeconds: function (time) {
            return new Date('1970-01-01T' + time + 'Z').getTime() / 1000;
        },

        toSS: function (seconds) { // MM:SS
            if (seconds < 60) {
                pos = [16, 3]
            } else if (seconds < 3600) {
                pos = [14, 5]
            } else {
                pos = [11, 8]
            }
            var date = new Date(null);
            date.setSeconds(seconds);
            return date.toISOString().substr(pos[0], pos[1]);
        },
        toHHMMSS: function (seconds) { // toHHMMSS
            var date = new Date(null);
            date.setSeconds(seconds);
            return date.toISOString().substr(11, 8);
        },

        alert: function (value) {
            //console.log(value)
            switch (app.getSelectedOption("alert")) {
                case "vibrate":
                    value = (value == "finish") ? [500, 1e3, 500, 1e3, 500, 1e3, 500, 1e3, 500, 1e3, 500] : 500;
                    app.vibrate(value);
                    break;
                case "whistle":
                    value = (value == "finish") ? "whistle3" : "whistle1";
                    app.speech(value);
                    break;
                default:
                    app.speech(value);
            }
        },

        speech: function (filename) { // app.alert
            // https://text-to-app.alert-demo.ng.bluemix.net/
            new Audio('sounds/' + filename + '.mp3').play();
        },

        vibrate: function (pattern) {
            if (window.navigator.vibrate) {
                window.navigator.vibrate(pattern);
            } else {
                console.warn("Not support Vibration API.")
            }
        },

        keepAwake: function () {
            if (window.plugins) {
                window.plugins.insomnia.keepAwake(function () {
                    alert("Insomnia ok")
                }, function (err) {
                    alert("Insomnia err", err.toString())
                });
            } else {
                console.warn("Not support Insomnia Plugin.")
            }
        }
    };
    app.initialize();
})